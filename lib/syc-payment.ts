/**
 * SYC 코인 결제 유틸리티
 * ──────────────────────
 * 1. 메타마스크 지갑 연결
 * 2. PancakeSwap에서 SYC 실시간 시세 조회
 * 3. BEP-20 토큰 전송 (고객 → 회사 지갑)
 * 4. 트랜잭션 완료 확인
 *
 * 네트워크: BSC (BNB Smart Chain) - chainId 56
 */

// ═══════════════════════════════════════
//  상수 정의
// ═══════════════════════════════════════

/** SYC 토큰 컨트랙트 주소 */
export const SYC_CONTRACT = "0x6b2880CE191c790cA47329Dd761B07b71284785F";

/** 결제 수신 지갑 (회사 지갑) */
export const RECEIVER_WALLET = "0x766471d169F0e914f3f56d9e9b3d8d8F7490cCee";

/** BSC 메인넷 설정 */
export const BSC_CHAIN = {
  chainId: "0x38", // 56 in hex
  chainName: "BNB Smart Chain",
  nativeCurrency: { name: "BNB", symbol: "BNB", decimals: 18 },
  rpcUrls: ["https://bsc-dataseed.binance.org/"],
  blockExplorerUrls: ["https://bscscan.com/"],
};

/** WBNB 주소 (PancakeSwap 시세 조회용) */
const WBNB = "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c";

/** PancakeSwap V2 Router 주소 */
const PANCAKE_ROUTER = "0x10ED43C718714eb63d5aA57B78B54704E256024E";

/** BEP-20 transfer ABI (토큰 전송에 필요한 최소 ABI) */
const ERC20_ABI = [
  "function transfer(address to, uint256 amount) returns (bool)",
  "function balanceOf(address owner) view returns (uint256)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function allowance(address owner, address spender) view returns (uint256)",
];

/** PancakeSwap Router ABI (시세 조회용) */
const ROUTER_ABI = [
  "function getAmountsOut(uint256 amountIn, address[] calldata path) view returns (uint256[] memory amounts)",
];

// ═══════════════════════════════════════
//  타입 정의
// ═══════════════════════════════════════

export interface WalletInfo {
  address: string;
  sycBalance: number;
  bnbBalance: number;
  connected: boolean;
}

export interface SycPrice {
  sycPerBnb: number;    // 1 BNB = ? SYC
  bnbPerSyc: number;    // 1 SYC = ? BNB
  krwPerSyc: number;    // 1 SYC = ? KRW (원화)
  usdPerSyc: number;    // 1 SYC = ? USD
  bnbPriceKrw: number;  // 1 BNB = ? KRW
  updatedAt: string;
}

export interface PaymentResult {
  success: boolean;
  txHash?: string;
  error?: string;
  sycAmount?: number;
  krwAmount?: number;
}

// ═══════════════════════════════════════
//  메타마스크 (window.ethereum) 헬퍼
// ═══════════════════════════════════════

/** 메타마스크 설치 여부 */
export function isMetaMaskInstalled(): boolean {
  return typeof window !== "undefined" && !!window.ethereum;
}

/** 메타마스크 지갑 연결 */
export async function connectWallet(): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error("메타마스크가 설치되어 있지 않습니다.\n모바일: MetaMask 앱 내 브라우저에서 접속해주세요.\nPC: Chrome 확장프로그램을 설치해주세요.");
  }

  try {
    const result = await window.ethereum!.request({
      method: "eth_requestAccounts",
    });
    const accounts = result as string[];
    if (!accounts || accounts.length === 0) {
      throw new Error("지갑 연결이 취소되었습니다.");
    }
    return accounts[0];
  } catch (err: unknown) {
    const e = err as { code?: number; message?: string };
    if (e.code === 4001) {
      throw new Error("지갑 연결을 취소하셨습니다.");
    }
    throw new Error(`지갑 연결 실패: ${e.message || "알 수 없는 오류"}`);
  }
}

/** BSC 네트워크로 전환 (안 되어있으면 추가) */
export async function switchToBSC(): Promise<void> {
  if (!window.ethereum) return;

  try {
    await window.ethereum.request({
      method: "wallet_switchEthereumChain",
      params: [{ chainId: BSC_CHAIN.chainId }],
    });
  } catch (err: unknown) {
    const e = err as { code?: number };
    // 4902: 체인이 메타마스크에 없으면 추가
    if (e.code === 4902) {
      await window.ethereum!.request({
        method: "wallet_addEthereumChain",
        params: [BSC_CHAIN],
      });
    } else {
      throw new Error("BSC 네트워크 전환에 실패했습니다.");
    }
  }
}

/** 현재 연결된 체인 ID 확인 */
export async function getChainId(): Promise<string> {
  if (!window.ethereum) return "";
  const chainId = await window.ethereum.request({ method: "eth_chainId" });
  return chainId as string;
}

// ═══════════════════════════════════════
//  ethers.js (CDN으로 로드 — npm 설치 불필요!)
// ═══════════════════════════════════════

let ethersModule: any | null = null;

async function getEthers(): Promise<any> {
  if (ethersModule) return ethersModule;

  // window.ethers가 이미 있으면 (CDN 로드 완료)
  if (typeof window !== "undefined" && (window as any).ethers) {
    ethersModule = (window as any).ethers;
    return ethersModule;
  }

  // CDN에서 ethers.js 동적 로드
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/ethers/6.13.4/ethers.umd.min.js";
    script.onload = () => {
      ethersModule = (window as any).ethers;
      if (ethersModule) resolve(ethersModule);
      else reject(new Error("ethers 로드 실패"));
    };
    script.onerror = () => reject(new Error("ethers CDN 로드 실패"));
    document.head.appendChild(script);
  });
}

// ═══════════════════════════════════════
//  SYC 잔액 조회
// ═══════════════════════════════════════

/** 지갑의 SYC 잔액 + BNB 잔액 조회 */
export async function getWalletInfo(address: string): Promise<WalletInfo> {
  const ethers = await getEthers();
  const provider = new ethers.BrowserProvider(window.ethereum!);

  // BNB 잔액
  const bnbRaw = await provider.getBalance(address);
  const bnbBalance = parseFloat(ethers.formatEther(bnbRaw));

  // SYC 잔액
  const sycContract = new ethers.Contract(SYC_CONTRACT, ERC20_ABI, provider);
  const decimals = await sycContract.decimals();
  const sycRaw = await sycContract.balanceOf(address);
  const sycBalance = parseFloat(ethers.formatUnits(sycRaw, decimals));

  return { address, sycBalance, bnbBalance, connected: true };
}

// ═══════════════════════════════════════
//  PancakeSwap 실시간 시세 조회
// ═══════════════════════════════════════

/** PancakeSwap에서 SYC 시세 조회 */
export async function getSycPrice(): Promise<SycPrice> {
  const ethers = await getEthers();
  const provider = new ethers.BrowserProvider(window.ethereum!);

  const router = new ethers.Contract(PANCAKE_ROUTER, ROUTER_ABI, provider);

  // 1 BNB → SYC 가격 조회
  const onebnb = ethers.parseEther("1");
  let sycPerBnb: number;

  try {
    const amounts = await router.getAmountsOut(onebnb, [WBNB, SYC_CONTRACT]);
    // SYC decimals 확인
    const sycContract = new ethers.Contract(SYC_CONTRACT, ERC20_ABI, provider);
    const decimals = await sycContract.decimals();
    sycPerBnb = parseFloat(ethers.formatUnits(amounts[1], decimals));
  } catch {
    // PancakeSwap 조회 실패 시 유동성풀 기준 (500만 SYC / 2 BNB)
    sycPerBnb = 2500000;
  }

  const bnbPerSyc = 1 / sycPerBnb;

  // BNB 원화 시세 (CoinGecko 무료 API)
  let bnbPriceKrw = 800000; // 기본값 (약 80만원)
  let bnbPriceUsd = 620;
  try {
    const res = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=binancecoin&vs_currencies=krw,usd",
      { cache: "no-store" }
    );
    if (res.ok) {
      const data = await res.json();
      bnbPriceKrw = data.binancecoin?.krw || bnbPriceKrw;
      bnbPriceUsd = data.binancecoin?.usd || bnbPriceUsd;
    }
  } catch {
    // CoinGecko 실패 시 기본값 사용
  }

  const krwPerSyc = bnbPerSyc * bnbPriceKrw;
  const usdPerSyc = bnbPerSyc * bnbPriceUsd;

  return {
    sycPerBnb,
    bnbPerSyc,
    krwPerSyc,
    usdPerSyc,
    bnbPriceKrw,
    updatedAt: new Date().toISOString(),
  };
}

/** 원화 금액을 SYC 수량으로 변환 */
export function krwToSyc(krwAmount: number, sycPrice: SycPrice): number {
  if (sycPrice.krwPerSyc <= 0) return 0;
  return Math.ceil(krwAmount / sycPrice.krwPerSyc);
}

// ═══════════════════════════════════════
//  SYC 토큰 전송 (결제 실행)
// ═══════════════════════════════════════

/** SYC 토큰을 회사 지갑으로 전송 */
export async function sendSycPayment(sycAmount: number): Promise<PaymentResult> {
  const ethers = await getEthers();
  const provider = new ethers.BrowserProvider(window.ethereum!);
  const signer = await provider.getSigner();

  const sycContract = new ethers.Contract(SYC_CONTRACT, ERC20_ABI, signer);
  const decimals = await sycContract.decimals();

  // 소수점 처리: SYC는 정수 단위로 전송
  const amount = ethers.parseUnits(Math.ceil(sycAmount).toString(), decimals);

  // 잔액 확인
  const balance = await sycContract.balanceOf(await signer.getAddress());
  if (balance < amount) {
    const balFormatted = parseFloat(ethers.formatUnits(balance, decimals));
    return {
      success: false,
      error: `SYC 잔액이 부족합니다.\n필요: ${Math.ceil(sycAmount).toLocaleString()} SYC\n보유: ${Math.floor(balFormatted).toLocaleString()} SYC`,
    };
  }

  try {
    // BEP-20 transfer 실행 (메타마스크 서명 팝업 뜸)
    const tx = await sycContract.transfer(RECEIVER_WALLET, amount);

    // 트랜잭션 확인 대기 (블록에 포함될 때까지)
    const receipt = await tx.wait();

    if (receipt.status === 1) {
      return {
        success: true,
        txHash: receipt.hash,
        sycAmount: Math.ceil(sycAmount),
      };
    } else {
      return { success: false, error: "트랜잭션이 실패했습니다." };
    }
  } catch (err: unknown) {
    const e = err as { code?: string; message?: string };
    if (e.code === "ACTION_REJECTED" || e.code === "4001") {
      return { success: false, error: "결제를 취소하셨습니다." };
    }
    return { success: false, error: `전송 실패: ${e.message || "알 수 없는 오류"}` };
  }
}

// ═══════════════════════════════════════
//  window.ethereum 타입 확장
// ═══════════════════════════════════════

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on?: (event: string, handler: (...args: unknown[]) => void) => void;
      removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}
