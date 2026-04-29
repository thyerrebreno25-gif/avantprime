"use client";
import React, { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Building2,
  ChevronDown,
  ChevronRight,
  CircleDollarSign,
  CreditCard,
  Download,
  FileText,
  FolderTree,
  Landmark,
  Pencil,
  Plus,
  RefreshCcw,
  Search,
  Settings,
  Trash2,
  Upload,
  UserCog,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts";

type UserCategory = "MASTER" | "GESTOR" | "OPERADOR" | "CLIENTE";
type EntryStatus = "Pendente" | "Sugestão" | "Conciliado";
type FinanceStatus = "Pendente" | "A vencer" | "Vence hoje" | "Pago" | "Recebido";
type TransactionType = "receita" | "despesa";

type AuthUser = {
  id: number;
  name: string;
  email: string;
  category: UserCategory;
  companyId: number;
};

type Company = {
  id: number;
  name: string;
  document: string;
  tradeName: string;
};

type BankAccount = {
  id: number;
  companyId: number;
  bank: string;
  label: string;
  agency: string;
  account: string;
  balance: number;
};

type UserAccess = {
  id: number;
  companyId: number;
  name: string;
  email: string;
  cpf: string;
  category: UserCategory;
  tempPassword: string;
};

type BankTransaction = {
  id: number;
  companyId: number;
  bankAccountId: number;
  date: string;
  description: string;
  amount: number;
  type: TransactionType;
  paymentType: string;
  category: string;
  status: EntryStatus;
  sourceFile?: string;
  linkedType?: "payable" | "receivable";
  linkedId?: number;
};

type Payable = {
  id: number;
  companyId: number;
  description: string;
  amount: number;
  paymentType: string;
  dueDate: string;
  launchDate: string;
  user: string;
  category: string;
  status: FinanceStatus;
};

type Receivable = {
  id: number;
  companyId: number;
  description: string;
  amount: number;
  paymentType: string;
  dueDate: string;
  launchDate: string;
  user: string;
  category: string;
  status: FinanceStatus;
};

type ImportRecord = {
  id: number;
  companyId: number;
  bankAccountId: number | null;
  file: string;
  type: string;
  status: string;
};

type CategoryGroup = {
  id: string;
  code: string;
  name: string;
  kind: "receita" | "despesa";
  subcategories: string[];
};

const menuItems = [
  { key: "dashboard", label: "Dashboard", icon: BarChart3 },
  { key: "acessos", label: "Acessos", icon: UserCog },
  { key: "empresas", label: "Empresas", icon: Building2 },
  { key: "contas", label: "Contas Bancárias", icon: Landmark },
  { key: "importacao", label: "Importar Arquivos", icon: Upload },
  { key: "pagar", label: "Contas a Pagar", icon: CreditCard },
  { key: "receber", label: "Contas a Receber", icon: CircleDollarSign },
  { key: "categorias", label: "Categorias Financeiras", icon: FolderTree },
  { key: "conciliacao", label: "Conciliação", icon: RefreshCcw },
  { key: "pendencias", label: "Pendências", icon: AlertTriangle },
  { key: "relatorios", label: "Relatórios", icon: FileText },
  { key: "configuracoes", label: "Configurações", icon: Settings },
] as const;

type MenuKey = (typeof menuItems)[number]["key"];

const initialCompanies: Company[] = [
  { id: 1, name: "Breno Finance Group", tradeName: "BFG", document: "12.345.678/0001-99" },
  { id: 2, name: "Atlas Serviços", tradeName: "Atlas", document: "98.765.432/0001-10" },
];

const initialAccounts: BankAccount[] = [
  { id: 1, companyId: 1, bank: "Banco do Brasil", label: "Conta Principal", agency: "1234-5", account: "98765-1", balance: 0 },
  { id: 2, companyId: 1, bank: "Itaú", label: "Conta Operacional", agency: "2222", account: "45678-9", balance: 0 },
  { id: 3, companyId: 2, bank: "Inter", label: "Conta Atlas", agency: "0001", account: "12345-6", balance: 0 },
];

const initialUsers: UserAccess[] = [
  { id: 1, companyId: 1, name: "Administrador Master", email: "master@finconciliador.com", cpf: "000.000.000-00", category: "MASTER", tempPassword: "Master@123" },
  { id: 2, companyId: 1, name: "Mariana Lopes", email: "mariana@empresa.com", cpf: "111.111.111-11", category: "GESTOR", tempPassword: "Gestor@123" },
  { id: 3, companyId: 1, name: "João Silva", email: "joao@empresa.com", cpf: "222.222.222-22", category: "OPERADOR", tempPassword: "Operador@123" },
  { id: 4, companyId: 2, name: "Cliente Atlas", email: "cliente@atlas.com", cpf: "333.333.333-33", category: "CLIENTE", tempPassword: "Cliente@123" },
];

const initialCategoryGroups: CategoryGroup[] = [
  {
    id: "r-301",
    code: "3.01",
    name: "Receitas de Vendas e de Serviços",
    kind: "receita",
    subcategories: ["Vendas de produtos", "Prestação de serviços", "Receita recorrente", "Mensalidades", "Assinaturas", "Comissões recebidas"],
  },
  {
    id: "r-302",
    code: "3.02",
    name: "Receitas Financeiras",
    kind: "receita",
    subcategories: ["Receitas financeiras", "Rendimentos bancários", "Juros recebidos"],
  },
  {
    id: "r-303",
    code: "3.03",
    name: "Outras Receitas e Entradas",
    kind: "receita",
    subcategories: ["Aluguéis recebidos", "Receita operacional", "Outras receitas"],
  },
  {
    id: "d-401",
    code: "4.01",
    name: "Pessoal e Encargos",
    kind: "despesa",
    subcategories: ["Folha de pagamento", "Pró-labore", "Encargos trabalhistas"],
  },
  {
    id: "d-402",
    code: "4.02",
    name: "Fornecedores e Compras",
    kind: "despesa",
    subcategories: ["Fornecedores", "Compras de mercadorias", "Matéria-prima", "Fretes"],
  },
  {
    id: "d-403",
    code: "4.03",
    name: "Estrutura e Operação",
    kind: "despesa",
    subcategories: ["Aluguel", "Condomínio", "Energia elétrica", "Água", "Internet", "Telefone", "Manutenção"],
  },
  {
    id: "d-404",
    code: "4.04",
    name: "Administrativas e Comerciais",
    kind: "despesa",
    subcategories: ["Marketing", "Tráfego pago", "Sistema / software", "Contabilidade", "Jurídico", "Despesas administrativas", "Viagens"],
  },
  {
    id: "d-405",
    code: "4.05",
    name: "Financeiras e Tributárias",
    kind: "despesa",
    subcategories: ["Impostos", "Taxas bancárias", "Tarifas bancárias", "Despesas financeiras", "Juros pagos", "Seguros", "Outras despesas"],
  },
];

const initialPayables: Payable[] = [];
const initialReceivables: Receivable[] = [];
const initialTransactions: BankTransaction[] = [];
const initialImports: ImportRecord[] = [];

const AUTH_STORAGE_KEY = "finconciliador-auth";

function formatDateBR(date: string) {
  if (!date) return "-";

  const cleanDate = date.includes("T") ? date.split("T")[0] : date;
  const [year, month, day] = cleanDate.split("-");

  if (!year || !month || !day) return date;

  return `${day}/${month}/${year}`;
}

function currency(value: number) {
  return Number(value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatDateToInput(brDate: string) {
  if (!brDate) return "";
  const [d, m, y] = brDate.split("/");
  return `${y}-${m}-${d}`;
}

function formatDateToBR(isoDate: string) {
  if (!isoDate) return "";
  const [y, m, d] = isoDate.split("-");
  return `${d}/${m}/${y}`;
}

function monthKeyFromBRDate(brDate: string) {
  if (!brDate) return "";
  const [_d, m, y] = brDate.split("/");
  return `${y}-${m}`;
}

function SectionTitle({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

function Badge({ status }: { status: string }) {
  const map: Record<string, string> = {
    Conciliado: "bg-emerald-100 text-emerald-700",
    Pendente: "bg-amber-100 text-amber-700",
    Sugestão: "bg-sky-100 text-sky-700",
    "A vencer": "bg-indigo-100 text-indigo-700",
    "Vence hoje": "bg-rose-100 text-rose-700",
    Pago: "bg-emerald-100 text-emerald-700",
    Recebido: "bg-emerald-100 text-emerald-700",
    MASTER: "bg-slate-900 text-white",
    GESTOR: "bg-sky-100 text-sky-700",
    OPERADOR: "bg-amber-100 text-amber-700",
    CLIENTE: "bg-emerald-100 text-emerald-700",
  };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${map[status] ?? "bg-slate-100 text-slate-700"}`}>{status}</span>;
}

function SummaryCard({ title, value, helper, tone }: { title: string; value: string | number; helper?: string; tone?: "green" | "red" | "default" }) {
  const toneStyle =
    tone === "green"
      ? "bg-emerald-50 ring-emerald-200"
      : tone === "red"
        ? "bg-rose-50 ring-rose-200"
        : "bg-white ring-slate-200";

  return (
    <div className={`rounded-3xl p-5 shadow-sm ring-1 ${toneStyle}`}>
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-bold">{value}</p>
      {helper ? <p className="mt-2 text-xs text-slate-400">{helper}</p> : null}
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-sm text-slate-500">{text}</div>;
}

function LoginScreen({
  error,
  onLogin,
}: {
  error: string;
  onLogin: (payload: { email: string; password: string }) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="grid min-h-screen lg:grid-cols-2">
        <div className="hidden lg:flex flex-col justify-between bg-slate-900 p-10 text-white">
          <div>
            <div className="inline-flex items-center rounded-full border border-white/15 px-4 py-2 text-sm text-slate-200">
              FinConciliador
            </div>
            <h1 className="mt-8 max-w-xl text-5xl font-bold leading-tight">
              Controle financeiro com conciliação bancária em um único painel.
            </h1>
            <p className="mt-6 max-w-lg text-base text-slate-300">
              Acesse empresas, contas bancárias, contas a pagar e a receber, categorias financeiras, conciliação por conta e relatórios gerenciais.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">Conciliação</p>
              <p className="mt-2 text-2xl font-bold">Por conta</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">Fluxo de caixa</p>
              <p className="mt-2 text-2xl font-bold">Prev. x Real.</p>
            </div>
            <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
              <p className="text-sm text-slate-300">Acessos</p>
              <p className="mt-2 text-2xl font-bold">Perfis</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center p-6 md:p-10">
          <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-sm ring-1 ring-slate-200">
            <div>
              <p className="text-sm font-medium text-slate-500">Bem-vindo</p>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-slate-900">Entrar no sistema</h2>
              <p className="mt-2 text-sm text-slate-500">
                Use seu e-mail e senha provisória para acessar o painel.
              </p>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                onLogin({ email, password });
              }}
              className="mt-8 space-y-4"
            >
              <div>
                <label className="mb-1 block text-sm text-slate-500">E-mail</label>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  type="email"
                  placeholder="voce@empresa.com"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm text-slate-500">Senha</label>
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  type="password"
                  placeholder="Digite sua senha"
                  className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm outline-none focus:border-slate-500"
                />
              </div>

              {error ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <button className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-medium text-white transition hover:opacity-95">
                Entrar
              </button>
            </form>

            <div className="mt-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              <p className="font-semibold text-slate-800">Acesso inicial de teste</p>
              <p className="mt-2">E-mail: master@finconciliador.com</p>
              <p>Senha: Master@123</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Page() {
  const [activePage, setActivePage] = useState<MenuKey>("dashboard");
  const [companies, setCompanies] = useState<Company[]>(initialCompanies);
  const [activeCompanyId, setActiveCompanyId] = useState<number>(1);
  const [accounts, setAccounts] = useState<BankAccount[]>(initialAccounts);
  const [users, setUsers] = useState<UserAccess[]>(initialUsers);
  const [transactions, setTransactions] = useState<BankTransaction[]>(initialTransactions);
  const [payables, setPayables] = useState<Payable[]>(initialPayables);
  const [receivables, setReceivables] = useState<Receivable[]>(initialReceivables);
  const [imports, setImports] = useState<ImportRecord[]>(initialImports);
  const [categoryGroups, setCategoryGroups] = useState<CategoryGroup[]>(initialCategoryGroups);
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");
  const [selectedFile, setSelectedFile] = useState("");
  const [selectedImportAccountId, setSelectedImportAccountId] = useState<number | "">("");
  const [conciliationAccountId, setConciliationAccountId] = useState<number | "">("");
  const [activeReport, setActiveReport] = useState("fluxo-caixa");
  const [ownSettings, setOwnSettings] = useState({ name: "Administrador Master", email: "master@finconciliador.com", password: "" });
  const [authUser, setAuthUser] = useState<AuthUser | null>(null);
  const [authError, setAuthError] = useState("");
  const [authReady, setAuthReady] = useState(false);

  const [companyForm, setCompanyForm] = useState({ name: "", tradeName: "", document: "" });
  const [accountForm, setAccountForm] = useState({ bank: "", label: "", agency: "", account: "" });
  const [userForm, setUserForm] = useState({ name: "", email: "", cpf: "", category: "OPERADOR" as UserCategory, tempPassword: "" });
  const [payableForm, setPayableForm] = useState({ description: "", amount: "", paymentType: "Boleto", dueDate: "", launchDate: "", user: "Administrador Master", category: "Fornecedores" });
  const [receivableForm, setReceivableForm] = useState({ description: "", amount: "", paymentType: "PIX", dueDate: "", launchDate: "", user: "Administrador Master", category: "Vendas de produtos" });
  const [categoryForm, setCategoryForm] = useState({ kind: "receita" as "receita" | "despesa", groupId: "", groupName: "", subcategory: "" });
  const [editingPayableId, setEditingPayableId] = useState<number | null>(null);
  const [editingReceivableId, setEditingReceivableId] = useState<number | null>(null);
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);

  const activeCompany = companies.find((item) => item.id === activeCompanyId) ?? companies[0];

  

  useEffect(() => {
  async function loadPayables() {
    if (!authUser) return;

    const response = await fetch("/api/payables", {
      credentials: "include",
    });

    if (!response.ok) {
      console.error("Erro ao buscar despesas");
      return;
    }

    const data = await response.json();

    setPayables(
      data.payables.map((p: any) => ({
        ...p,
        amount: Number(p.amount),
        dueDate: p.dueDate.slice(0, 10),
        launchDate: p.launchDate.slice(0, 10),
      }))
    );
  }

  loadPayables();
}, [authUser]);

  useEffect(() => {
  async function loadSession() {
    try {
      const response = await fetch("/api/auth/me", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        setAuthUser(null);
        setAuthReady(true);
        return;
      }

      const data = await response.json();

      if (data.user) {
        setAuthUser(data.user);
        setActiveCompanyId(data.user.companyId);
        setOwnSettings((current) => ({
          ...current,
          name: data.user.name,
          email: data.user.email,
        }));
      } else {
        setAuthUser(null);
      }
    } catch {
      setAuthUser(null);
    } finally {
      setAuthReady(true);
    }
  }

  loadSession();
}, []);

  useEffect(() => {
  async function loadPayables() {
    if (!authUser) return;

    const response = await fetch("/api/payables", {
      credentials: "include",
    });

    if (!response.ok) return;

    const data = await response.json();

    setPayables(
      data.payables.map((p: any) => ({
        ...p,
        amount: Number(p.amount),
        dueDate: p.dueDate.slice(0, 10),
        launchDate: p.launchDate.slice(0, 10),
      }))
    );
  }

  loadPayables();
}, [authUser]);

  useEffect(() => {
  async function loadUsers() {
    if (!authUser) return;

    const response = await fetch("/api/users", {
      credentials: "include",
    });

    if (!response.ok) return;

    const data = await response.json();
    setUsers(data.users);
  }

  loadUsers();
}, [authUser]);

  useEffect(() => {
    const saved = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as AuthUser;
        setAuthUser(parsed);
        setActiveCompanyId(parsed.companyId);
        setOwnSettings((current) => ({ ...current, name: parsed.name, email: parsed.email }));
      } catch {
        window.localStorage.removeItem(AUTH_STORAGE_KEY);
      }
    }
    setAuthReady(true);
  }, []);

  async function handleOfxUpload(file: File) {
  try {
    setImportMessage("Processando arquivo...");

    if (!selectedImportAccountId) {
  setImportMessage("Selecione uma conta bancária antes de importar.");
  return;
}

    const formData = new FormData();
    formData.append("file", file);
    formData.append("bankAccountId", String(selectedImportAccountId));

    const response = await fetch("/api/ofx", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      setImportMessage(data.error || "Erro ao processar o arquivo.");
      return;
    }

    setImportMessage(
  `Arquivo importado com sucesso. ${data.savedCount || 0} lançamentos salvos e ${data.ignoredCount || 0} ignorados.`
);
  } catch {
    setImportMessage("Erro ao enviar o arquivo.");
  }
}

<input
  type="file"
  accept=".ofx"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) handleOfxUpload(file);
  }}
/>

  const companyAccounts = useMemo(() => accounts.filter((item) => item.companyId === activeCompanyId), [accounts, activeCompanyId]);
  const companyUsers = useMemo(() => users.filter((item) => item.companyId === activeCompanyId), [users, activeCompanyId]);
  const companyTransactions = useMemo(() => transactions.filter((item) => item.companyId === activeCompanyId), [transactions, activeCompanyId]);
  const companyPayables = useMemo(() => payables.filter((item) => item.companyId === activeCompanyId), [payables, activeCompanyId]);
  const companyReceivables = useMemo(() => receivables.filter((item) => item.companyId === activeCompanyId), [receivables, activeCompanyId]);
  const companyImports = useMemo(() => imports.filter((item) => item.companyId === activeCompanyId), [imports, activeCompanyId]);

  const selectedConciliationAccountId = conciliationAccountId === "" ? companyAccounts[0]?.id ?? "" : conciliationAccountId;

  const dashboardSummary = useMemo(() => {
    const receitaRealizada = companyReceivables.filter((item) => item.status === "Recebido").reduce((acc, item) => acc + item.amount, 0);
    const despesaRealizada = companyPayables.filter((item) => item.status === "Pago").reduce((acc, item) => acc + item.amount, 0);
    const conciliados = companyTransactions.filter((item) => item.status === "Conciliado").length;
    const pendentes = companyTransactions.filter((item) => item.status !== "Conciliado").length;
    const saldoContas = companyAccounts.reduce((acc, item) => acc + item.balance, 0);
    const pagamentosFuturos = companyPayables.filter((item) => item.status === "A vencer").reduce((acc, item) => acc + item.amount, 0);
    const pagamentosHoje = companyPayables.filter((item) => item.status === "Vence hoje").reduce((acc, item) => acc + item.amount, 0);
    const recebimentosFuturos = companyReceivables.filter((item) => item.status === "A vencer").reduce((acc, item) => acc + item.amount, 0);
    const recebimentosHoje = companyReceivables.filter((item) => item.status === "Vence hoje").reduce((acc, item) => acc + item.amount, 0);
    return { receitaRealizada, despesaRealizada, conciliados, pendentes, saldoContas, pagamentosFuturos, pagamentosHoje, recebimentosFuturos, recebimentosHoje };
  }, [companyAccounts, companyPayables, companyReceivables, companyTransactions]);

  const dashboardBarData = [
    { name: "Receitas", total: dashboardSummary.receitaRealizada },
    { name: "Despesas", total: dashboardSummary.despesaRealizada },
  ];

  const dashboardPieData = [
    { name: "Receitas", value: dashboardSummary.receitaRealizada },
    { name: "Despesas", value: dashboardSummary.despesaRealizada },
  ];

  const filteredMovements = useMemo(() => {
    if (!search.trim()) return companyTransactions;
    const term = search.toLowerCase();
    return companyTransactions.filter((item) =>
      [item.date, item.description, item.category, item.paymentType, item.status]
        .join(" ")
        .toLowerCase()
        .includes(term)
    );
  }, [companyTransactions, search]);

  const conciliationTransactions = useMemo(
    () => companyTransactions.filter((item) => item.bankAccountId === selectedConciliationAccountId && item.status !== "Conciliado"),
    [companyTransactions, selectedConciliationAccountId]
  );

  const revenueGroups = categoryGroups.filter((item) => item.kind === "receita");
  const expenseGroups = categoryGroups.filter((item) => item.kind === "despesa");
  const revenueSubcategories = revenueGroups.flatMap((item) => item.subcategories);
  const expenseSubcategories = expenseGroups.flatMap((item) => item.subcategories);

  const monthlyReportData = useMemo(() => {
    const months = ["2026-01", "2026-02", "2026-03", "2026-04", "2026-05", "2026-06", "2026-07", "2026-08", "2026-09", "2026-10", "2026-11", "2026-12"];
    let runningPrevisto = 0;
    let runningRealizado = 0;

    return months.map((month) => {
      const mesLabel = month.replace("2026-", "");
      const recebPrev = companyReceivables.filter((item) => monthKeyFromBRDate(item.dueDate) === month).reduce((acc, item) => acc + item.amount, 0);
      const pagPrev = companyPayables.filter((item) => monthKeyFromBRDate(item.dueDate) === month).reduce((acc, item) => acc + item.amount, 0);
      const recebReal = companyReceivables.filter((item) => monthKeyFromBRDate(item.dueDate) === month && item.status === "Recebido").reduce((acc, item) => acc + item.amount, 0);
      const pagReal = companyPayables.filter((item) => monthKeyFromBRDate(item.dueDate) === month && item.status === "Pago").reduce((acc, item) => acc + item.amount, 0);
      runningPrevisto += recebPrev - pagPrev;
      runningRealizado += recebReal - pagReal;
      return {
        monthKey: month,
        month: `${mesLabel}/26`,
        recebPrev,
        recebReal,
        pagPrev,
        pagReal,
        saldoPrev: runningPrevisto,
        saldoReal: runningRealizado,
      };
    });
  }, [companyPayables, companyReceivables]);

  const reportRows = useMemo(() => {
    const rows: { label: string; janPrev: number; janReal: number; fevPrev: number; fevReal: number; marPrev: number; marReal: number }[] = [];
    const firstQuarter = ["2026-01", "2026-02", "2026-03"];

    const buildValues = (list: Array<Payable | Receivable>, filterFn: (item: Payable | Receivable) => boolean) => {
      return firstQuarter.map((month) =>
        list
          .filter((item) => monthKeyFromBRDate(item.dueDate) === month && filterFn(item))
          .reduce((acc, item) => acc + item.amount, 0)
      );
    };

    const saldoPrev = monthlyReportData.slice(0, 3).map((item) => item.saldoPrev);
    const saldoReal = monthlyReportData.slice(0, 3).map((item) => item.saldoReal);
    const recebPrev = buildValues(companyReceivables, () => true);
    const recebReal = buildValues(companyReceivables, (item) => item.status === "Recebido");
    const pagPrev = buildValues(companyPayables, () => true);
    const pagReal = buildValues(companyPayables, (item) => item.status === "Pago");

    rows.push({ label: "Saldo do mês anterior", janPrev: saldoPrev[0] ?? 0, janReal: saldoReal[0] ?? 0, fevPrev: saldoPrev[1] ?? 0, fevReal: saldoReal[1] ?? 0, marPrev: saldoPrev[2] ?? 0, marReal: saldoReal[2] ?? 0 });
    rows.push({ label: "Total de recebimentos", janPrev: recebPrev[0] ?? 0, janReal: recebReal[0] ?? 0, fevPrev: recebPrev[1] ?? 0, fevReal: recebReal[1] ?? 0, marPrev: recebPrev[2] ?? 0, marReal: recebReal[2] ?? 0 });
    rows.push({ label: "Total de pagamentos", janPrev: pagPrev[0] ?? 0, janReal: pagReal[0] ?? 0, fevPrev: pagPrev[1] ?? 0, fevReal: pagReal[1] ?? 0, marPrev: pagPrev[2] ?? 0, marReal: pagReal[2] ?? 0 });

    categoryGroups.forEach((group) => {
      const source = group.kind === "receita" ? companyReceivables : companyPayables;
      const prev = firstQuarter.map((month) =>
        source
          .filter((item) => monthKeyFromBRDate(item.dueDate) === month && group.subcategories.includes(item.category))
          .reduce((acc, item) => acc + item.amount, 0)
      );
      const real = firstQuarter.map((month) =>
        source
          .filter((item) =>
            monthKeyFromBRDate(item.dueDate) === month &&
            group.subcategories.includes(item.category) &&
            (group.kind === "receita" ? item.status === "Recebido" : item.status === "Pago")
          )
          .reduce((acc, item) => acc + item.amount, 0)
      );
      rows.push({
        label: `${group.code} ${group.name}`,
        janPrev: prev[0] ?? 0,
        janReal: real[0] ?? 0,
        fevPrev: prev[1] ?? 0,
        fevReal: real[1] ?? 0,
        marPrev: prev[2] ?? 0,
        marReal: real[2] ?? 0,
      });
    });

    return rows;
  }, [categoryGroups, companyPayables, companyReceivables, monthlyReportData]);

  const nextId = (list: { id: number }[]) => (list.length ? Math.max(...list.map((item) => item.id)) + 1 : 1);

  async function handleLogin(payload: { email: string; password: string }) {
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      setAuthError(data.error || "Falha ao entrar.");
      return;
    }

    setAuthError("");
    setAuthUser(data.user);
    setActiveCompanyId(data.user.companyId);
    setOwnSettings((current) => ({
      ...current,
      name: data.user.name,
      email: data.user.email,
    }));
  } catch {
    setAuthError("Erro de conexão ao tentar entrar.");
  }
}

  async function handleLogout() {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "include",
    });
  } finally {
    setAuthUser(null);
    setAuthError("");
  }
}

function getStatus(item: any) {
  if (item.status === "PAGO") return "PAGO";

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  let vencimento: Date;

  // 👇 se vier como string BR (dd/mm/yyyy)
  if (typeof item.dueDate === "string" && item.dueDate.includes("/")) {
    const [dia, mes, ano] = item.dueDate.split("/");
    vencimento = new Date(`${ano}-${mes}-${dia}`);
  } else {
    vencimento = new Date(item.dueDate);
  }

  vencimento.setHours(0, 0, 0, 0);

  if (vencimento < hoje) return "VENCIDO";

  return "PENDENTE";
}

  function addCompany(e: React.FormEvent) {
    e.preventDefault();
    if (!companyForm.name || !companyForm.document) return;
    const company = { id: nextId(companies), name: companyForm.name, tradeName: companyForm.tradeName || companyForm.name, document: companyForm.document };
    setCompanies((current) => [...current, company]);
    setActiveCompanyId(company.id);
    setCompanyForm({ name: "", tradeName: "", document: "" });
  }

  function addBankAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!accountForm.bank || !accountForm.agency || !accountForm.account) return;
    setAccounts((current) => [
      ...current,
      {
        id: nextId(current),
        companyId: activeCompanyId,
        bank: accountForm.bank,
        label: accountForm.label || "Conta",
        agency: accountForm.agency,
        account: accountForm.account,
        balance: 0,
      },
    ]);
    setAccountForm({ bank: "", label: "", agency: "", account: "" });
  }

  function deleteBankAccount(id: number) {
    setAccounts((current) => current.filter((item) => item.id !== id));
    setTransactions((current) => current.filter((item) => item.bankAccountId !== id));
    setImports((current) => current.filter((item) => item.bankAccountId !== id));
    if (conciliationAccountId === id) setConciliationAccountId("");
  }

  async function addUser(e: React.FormEvent) {
  e.preventDefault();

  const response = await fetch("/api/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      name: userForm.name,
      email: userForm.email,
      cpf: userForm.cpf,
      category: userForm.category,
      password: userForm.tempPassword,
    }),
  });

  const data = await response.json();

  if (!response.ok) {
    alert(data.error || "Erro ao criar acesso.");
    return;
  }

  setUsers((current) => [...current, data.user]);

  setUserForm({
    name: "",
    email: "",
    cpf: "",
    category: "OPERADOR",
    tempPassword: "",
  });
}

async function deletePayable(id: number) {
  alert("entrou na função deletePayable: " + id);

  const response = await fetch(`/api/payables/${id}`, {
    method: "DELETE",
    credentials: "include",
  });

  alert("resposta status: " + response.status);

  const data = await response.json();

  if (!response.ok) {
    alert(data.error || "Erro ao excluir");
    return;
  }

  setPayables((current) =>
    current.filter((p) => Number(p.id) !== Number(id))
  );
}

  async function addPayable(e: React.FormEvent) {
  e.preventDefault();

  const isEditing = Boolean(editingPayableId);

  const response = await fetch(
    isEditing ? `/api/payables/${editingPayableId}` : "/api/payables",
    {
      method: isEditing ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({
        description: payableForm.description,
        amount: Number(payableForm.amount),
        paymentType: payableForm.paymentType,
        dueDate: payableForm.dueDate,
        launchDate: payableForm.launchDate,
        userName: authUser?.name,
        category: payableForm.category,
      }),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    alert(data.error || "Erro ao salvar despesa.");
    return;
  }

  const p = data.payable;

  const formattedPayable = {
    ...p,
    amount: Number(p.amount),
    dueDate: p.dueDate.slice(0, 10),
    launchDate: p.launchDate.slice(0, 10),
  };

  if (isEditing) {
    setPayables((current) =>
      current.map((item) =>
        Number(item.id) === Number(editingPayableId) ? formattedPayable : item
      )
    );
  } else {
    setPayables((current) => [...current, formattedPayable]);
  }

  setEditingPayableId(null);

  setPayableForm({
    description: "",
    amount: "",
    paymentType: "Boleto",
    dueDate: "",
    launchDate: "",
    category: expenseSubcategories[0] ?? "Fornecedores",
  });
}

  async function updatePayable(id: number) {
  const item = payables.find((p) => p.id === id);
  if (!item) return;

  const response = await fetch(`/api/payables/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(item),
  });

  const data = await response.json();

  if (!response.ok) {
    alert(data.error || "Erro ao atualizar.");
    return;
  }

  setPayables((current) =>
    current.map((p) =>
      p.id === id
        ? {
            ...data.payable,
            amount: Number(data.payable.amount),
            dueDate: data.payable.dueDate.slice(0, 10),
            launchDate: data.payable.launchDate.slice(0, 10),
          }
        : p
    )
  );
}

  function startEditPayable(item: any) {
  setEditingPayableId(item.id);

  setPayableForm({
    description: item.description,
    amount: String(item.amount),
    paymentType: item.paymentType,
    dueDate: item.dueDate,
    launchDate: item.launchDate,
    category: item.category,
  });
}

  function deletePayable(id: number) {
    setPayables((current) => current.filter((item) => item.id !== id));
    setTransactions((current) =>
      current.map((item) =>
        item.linkedType === "payable" && item.linkedId === id
          ? { ...item, linkedId: undefined, linkedType: undefined, status: "Pendente" }
          : item
      )
    );
  }

  function addReceivable(e: React.FormEvent) {
    e.preventDefault();
    if (!receivableForm.description || !receivableForm.amount || !receivableForm.dueDate || !receivableForm.launchDate) return;

    const data: Receivable = {
      id: editingReceivableId ?? nextId(receivables),
      companyId: activeCompanyId,
      description: receivableForm.description,
      amount: Number(receivableForm.amount),
      paymentType: receivableForm.paymentType,
      dueDate: formatDateToBR(receivableForm.dueDate),
      launchDate: formatDateToBR(receivableForm.launchDate),
      user: receivableForm.user,
      category: receivableForm.category,
      status: "A vencer",
    };

    setReceivables((current) =>
      editingReceivableId
        ? current.map((item) => (item.id === editingReceivableId ? { ...item, ...data, status: item.status } : item))
        : [data, ...current]
    );

    setEditingReceivableId(null);
    setReceivableForm({ description: "", amount: "", paymentType: "PIX", dueDate: "", launchDate: "", user: ownSettings.name, category: revenueSubcategories[0] ?? "Vendas de produtos" });
  }

  function startEditReceivable(item: Receivable) {
    setEditingReceivableId(item.id);
    setReceivableForm({
      description: item.description,
      amount: String(item.amount),
      paymentType: item.paymentType,
      dueDate: formatDateToInput(item.dueDate),
      launchDate: formatDateToInput(item.launchDate),
      user: item.user,
      category: item.category,
    });
  }

  function deleteReceivable(id: number) {
    setReceivables((current) => current.filter((item) => item.id !== id));
    setTransactions((current) =>
      current.map((item) =>
        item.linkedType === "receivable" && item.linkedId === id
          ? { ...item, linkedId: undefined, linkedType: undefined, status: "Pendente" }
          : item
      )
    );
  }

  function addCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!categoryForm.groupName && !categoryForm.groupId) return;

    if (categoryForm.groupId) {
      setCategoryGroups((current) =>
        current.map((group) =>
          group.id === categoryForm.groupId && categoryForm.subcategory.trim()
            ? { ...group, subcategories: [...group.subcategories, categoryForm.subcategory.trim()] }
            : group
        )
      );
    } else if (categoryForm.groupName.trim()) {
      const prefix = categoryForm.kind === "receita" ? "3" : "4";
      const existingCount = categoryGroups.filter((item) => item.kind === categoryForm.kind).length + 1;
      const code = `${prefix}.${String(existingCount).padStart(2, "0")}`;
      setCategoryGroups((current) => [
        ...current,
        {
          id: `${categoryForm.kind}-${Date.now()}`,
          code,
          name: categoryForm.groupName.trim(),
          kind: categoryForm.kind,
          subcategories: categoryForm.subcategory.trim() ? [categoryForm.subcategory.trim()] : [],
        },
      ]);
    }

    setCategoryForm({ kind: categoryForm.kind, groupId: "", groupName: "", subcategory: "" });
  }

  function toggleGroup(id: string) {
    setExpandedGroups((current) => ({ ...current, [id]: !current[id] }));
  }

  function deleteTransaction(id: number) {
    setTransactions((current) => current.filter((item) => item.id !== id));
  }

  function runAutoConciliation() {
    const pending = companyTransactions.find(
      (item) => item.bankAccountId === selectedConciliationAccountId && item.status !== "Conciliado" && item.linkedId
    );
    if (pending) reconcileTransaction(pending.id);
  }

  function reconcileTransaction(transactionId: number) {
    const tx = transactions.find((item) => item.id === transactionId);
    if (!tx) return;

    setTransactions((current) => current.map((item) => (item.id === transactionId ? { ...item, status: "Conciliado" } : item)));

    if (tx.linkedType === "payable" && tx.linkedId) {
      setPayables((current) => current.map((item) => (item.id === tx.linkedId ? { ...item, status: "Pago" } : item)));
    }

    if (tx.linkedType === "receivable" && tx.linkedId) {
      setReceivables((current) => current.map((item) => (item.id === tx.linkedId ? { ...item, status: "Recebido" } : item)));
    }

    setAccounts((current) =>
      current.map((item) =>
        item.id === tx.bankAccountId
          ? { ...item, balance: item.balance + (tx.type === "receita" ? tx.amount : -tx.amount) }
          : item
      )
    );
  }

  function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !selectedImportAccountId) return;

    const extension = file.name.split(".").pop()?.toUpperCase() || "ARQ";
    const allowed = ["OFX", "CSV", "CVS"];
    const importId = nextId(imports);

    setSelectedFile(file.name);
    setImports((current) => [
      {
        id: importId,
        companyId: activeCompanyId,
        bankAccountId: Number(selectedImportAccountId),
        file: file.name,
        type: extension,
        status: allowed.includes(extension) ? "Importado com sucesso" : "Formato não reconhecido",
      },
      ...current,
    ]);

    if (!allowed.includes(extension)) return;

    const localPayable = companyPayables[0];
    const localReceivable = companyReceivables[0];
    const mockTransactions: BankTransaction[] = [];

    if (localReceivable) {
      mockTransactions.push({
        id: nextId([...transactions, ...mockTransactions]),
        companyId: activeCompanyId,
        bankAccountId: Number(selectedImportAccountId),
        date: localReceivable.dueDate,
        description: localReceivable.description.toUpperCase(),
        amount: localReceivable.amount,
        type: "receita",
        paymentType: localReceivable.paymentType,
        category: localReceivable.category,
        status: "Sugestão",
        sourceFile: file.name,
        linkedType: "receivable",
        linkedId: localReceivable.id,
      });
    }

    if (localPayable) {
      mockTransactions.push({
        id: nextId([...transactions, ...mockTransactions]),
        companyId: activeCompanyId,
        bankAccountId: Number(selectedImportAccountId),
        date: localPayable.dueDate,
        description: localPayable.description.toUpperCase(),
        amount: localPayable.amount,
        type: "despesa",
        paymentType: localPayable.paymentType,
        category: localPayable.category,
        status: "Sugestão",
        sourceFile: file.name,
        linkedType: "payable",
        linkedId: localPayable.id,
      });
    }

    setTransactions((current) => [...mockTransactions, ...current]);
  }

  function saveOwnSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!authUser) return;

    setUsers((current) =>
      current.map((user) =>
        user.id === authUser.id
          ? {
              ...user,
              name: ownSettings.name,
              email: ownSettings.email,
              tempPassword: ownSettings.password || user.tempPassword,
            }
          : user
      )
    );

    const updatedAuthUser = {
      ...authUser,
      name: ownSettings.name,
      email: ownSettings.email,
    };

    setAuthUser(updatedAuthUser);
    window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(updatedAuthUser));
    setOwnSettings((current) => ({ ...current, password: "" }));
  }

  const renderDashboard = () => (
    <>
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SectionTitle title="Dashboard Financeiro" description="Visão consolidada das movimentações, receitas, despesas, vencimentos e conciliações." />
        <div className="flex flex-wrap gap-3">
  
  <label className="cursor-pointer rounded-2xl border border-slate-300 bg-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-slate-50">
    Importar OFX/CSV
    <input
      type="file"
      className="hidden"
      onChange={handleImport}
    />
  </label>

  <button
    onClick={runAutoConciliation}
    className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95"
  >
    Executar Conciliação
  </button>

</div>

{importMessage && (
  <div className="mt-4 rounded-2xl border border-green-200 bg-green-50 p-4 text-sm font-medium text-green-700">
    {importMessage}
  </div>
)}
      </header>

      <section className="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="Saldo Consolidado" value={currency(dashboardSummary.saldoContas)} />
        <SummaryCard title="Receitas" value={currency(dashboardSummary.receitaRealizada)} tone="green" />
        <SummaryCard title="Despesas" value={currency(dashboardSummary.despesaRealizada)} tone="red" />
        <SummaryCard title="Conciliados" value={dashboardSummary.conciliados} />
        <SummaryCard title="Pendentes" value={dashboardSummary.pendentes} />
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold">Receitas x despesas</h3>
          <p className="text-sm text-slate-500">Comparativo financeiro do período</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dashboardBarData} barCategoryGap={50}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis width={88} tickFormatter={(value) => currency(Number(value))} />
                <Tooltip formatter={(value) => currency(Number(value))} />
                <Bar dataKey="total" radius={[10, 10, 0, 0]}>
                  {dashboardBarData.map((entry) => (
                    <Cell key={entry.name} fill={entry.name === "Receitas" ? "#10b981" : "#ef4444"} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold">Distribuição</h3>
          <p className="text-sm text-slate-500">Visão percentual entre receitas e despesas</p>
          <div className="mt-4 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={dashboardPieData} innerRadius={55} outerRadius={84} dataKey="value" nameKey="name">
                  <Cell fill="#10b981" />
                  <Cell fill="#ef4444" />
                </Pie>
                <Tooltip formatter={(value) => currency(Number(value))} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Movimentações bancárias</h3>
              <p className="text-sm text-slate-500">Extrato importado, somente leitura e fiel ao banco.</p>
            </div>
            <div className="relative w-full md:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar lançamento" className="w-full rounded-xl border border-slate-300 py-2 pl-10 pr-3 text-sm outline-none focus:border-slate-500" />
            </div>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3 font-medium">Conta</th>
                  <th className="pb-3 font-medium">Data</th>
                  <th className="pb-3 font-medium">Descrição</th>
                  <th className="pb-3 font-medium">Categoria</th>
                  <th className="pb-3 font-medium">Pagamento</th>
                  <th className="pb-3 font-medium">Valor</th>
                  <th className="pb-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMovements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6"><EmptyState text="Sem movimentações importadas para esta empresa." /></td>
                  </tr>
                ) : (
                  filteredMovements.map((item) => (
                    <tr key={item.id} className="border-b border-slate-100 align-top">
                      <td className="py-4">{companyAccounts.find((account) => account.id === item.bankAccountId)?.bank ?? "Conta"}</td>
                      <td className="py-4">{item.date}</td>
                      <td className="py-4 font-medium">{item.description}</td>
                      <td className="py-4">{item.category}</td>
                      <td className="py-4">{item.paymentType}</td>
                      <td className={`py-4 font-medium ${item.type === "receita" ? "text-emerald-700" : "text-rose-700"}`}>{currency(item.amount)}</td>
                      <td className="py-4">
  <span
    className={`px-3 py-1 rounded-lg text-xs font-medium ${
      getStatus(item) === "PAGO"
        ? "bg-green-100 text-green-700"
        : getStatus(item) === "VENCIDO"
        ? "bg-red-100 text-red-700"
        : "bg-yellow-100 text-yellow-700"
    }`}
  >
    {getStatus(item) === "PAGO"
      ? "Pago"
      : getStatus(item) === "VENCIDO"
      ? "Vencido"
      : "Pendente"}
  </span>
</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold">Painel de vencimentos</h3>
          <p className="text-sm text-slate-500">O que está lançado e ainda está a vencer</p>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Pagamentos futuros</p><p className="mt-2 text-xl font-bold">{currency(dashboardSummary.pagamentosFuturos)}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Pagamentos que vencem hoje</p><p className="mt-2 text-xl font-bold">{currency(dashboardSummary.pagamentosHoje)}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Recebimentos futuros</p><p className="mt-2 text-xl font-bold">{currency(dashboardSummary.recebimentosFuturos)}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Recebimentos que vencem hoje</p><p className="mt-2 text-xl font-bold">{currency(dashboardSummary.recebimentosHoje)}</p></div>
          </div>
        </div>
      </section>
    </>
  );

  const renderAcessos = () => (
    <div className="grid gap-6 xl:grid-cols-5">
      <div className="xl:col-span-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <SectionTitle title="Acessos" description="Criar e gerenciar usuários da empresa ativa." />
        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[880px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3">Nome</th>
                <th className="pb-3">E-mail</th>
                <th className="pb-3">CPF</th>
                <th className="pb-3">Categoria</th>
                <th className="pb-3">Senha provisória</th>
                <th className="pb-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {companyUsers.map((user) => (
                <tr key={user.id} className="border-b border-slate-100">
                  <td className="py-4 font-medium">{user.name}</td>
                  <td className="py-4">{user.email}</td>
                  <td className="py-4">{user.cpf}</td>
                  <td className="py-4"><Badge status={user.category} /></td>
                  <td className="py-4">{user.tempPassword}</td>
                  <td className="py-4"><button onClick={() => deleteUser(user.id)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="xl:col-span-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold">Novo acesso</h3>
        <form onSubmit={addUser} className="mt-5 space-y-3">
          <input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} placeholder="Nome" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <input value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} placeholder="E-mail" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <input value={userForm.cpf} onChange={(e) => setUserForm({ ...userForm, cpf: e.target.value })} placeholder="CPF" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <select value={userForm.category} onChange={(e) => setUserForm({ ...userForm, category: e.target.value as UserCategory })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
            <option value="OPERADOR">OPERADOR</option>
            <option value="CLIENTE">CLIENTE</option>
            <option value="GESTOR">GESTOR</option>
            <option value="MASTER">MASTER</option>
          </select>
          <input value={userForm.tempPassword} onChange={(e) => setUserForm({ ...userForm, tempPassword: e.target.value })} placeholder="Senha provisória" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> Criar acesso</button>
        </form>
      </div>
    </div>
  );

  const renderEmpresas = () => (
    <div className="grid gap-6 xl:grid-cols-5">
      <div className="xl:col-span-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <SectionTitle title="Empresas" description="Selecione a empresa ativa e trabalhe com dados isolados por empresa." />
        <div className="mt-6 grid gap-4 md:grid-cols-2">
          {companies.map((company) => (
            <button key={company.id} onClick={() => setActiveCompanyId(company.id)} className={`rounded-2xl border p-4 text-left transition ${activeCompanyId === company.id ? "border-slate-900 bg-slate-900 text-white" : "border-slate-200 bg-white hover:bg-slate-50"}`}>
              <p className="font-semibold">{company.name}</p>
              <p className={`mt-1 text-sm ${activeCompanyId === company.id ? "text-slate-200" : "text-slate-500"}`}>{company.tradeName}</p>
              <p className={`mt-1 text-xs ${activeCompanyId === company.id ? "text-slate-300" : "text-slate-400"}`}>{company.document}</p>
            </button>
          ))}
        </div>
      </div>
      <div className="xl:col-span-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold">Nova empresa</h3>
        <form onSubmit={addCompany} className="mt-5 space-y-3">
          <input value={companyForm.name} onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })} placeholder="Razão social" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <input value={companyForm.tradeName} onChange={(e) => setCompanyForm({ ...companyForm, tradeName: e.target.value })} placeholder="Nome fantasia" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <input value={companyForm.document} onChange={(e) => setCompanyForm({ ...companyForm, document: e.target.value })} placeholder="CNPJ" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> Adicionar empresa</button>
        </form>
      </div>
    </div>
  );

  const renderContas = () => (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <SectionTitle title="Contas Bancárias" description="Cada conta é conciliada separadamente, mas o painel principal consolida todas." />
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {companyAccounts.map((item) => (
              <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900">{item.bank}</p>
                    <p className="mt-1 text-sm text-slate-500">{item.label}</p>
                    <p className="mt-1 text-xs text-slate-400">Ag. {item.agency} • CC {item.account}</p>
                  </div>
                  <button onClick={() => deleteBankAccount(item.id)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700"><Trash2 className="h-4 w-4" /></button>
                </div>
                <p className="mt-4 text-xl font-bold">{currency(item.balance)}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="xl:col-span-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold">Adicionar conta bancária</h3>
          <form onSubmit={addBankAccount} className="mt-5 space-y-3">
            <input value={accountForm.bank} onChange={(e) => setAccountForm({ ...accountForm, bank: e.target.value })} placeholder="Banco" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <input value={accountForm.label} onChange={(e) => setAccountForm({ ...accountForm, label: e.target.value })} placeholder="Dados da conta / apelido" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <input value={accountForm.agency} onChange={(e) => setAccountForm({ ...accountForm, agency: e.target.value })} placeholder="Agência" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <input value={accountForm.account} onChange={(e) => setAccountForm({ ...accountForm, account: e.target.value })} placeholder="Conta corrente" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> Adicionar conta</button>
          </form>
        </div>
      </div>
    </div>
  );

  const renderImportacao = () => (
  <div className="grid gap-6 xl:grid-cols-5">
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 xl:col-span-3">
      <SectionTitle
        title="Importar Arquivos"
        description="Importe OFX, CSV ou CVS e vincule a uma conta bancária."
      />

      <div className="mt-6 rounded-2xl border-2 border-dashed border-slate-300 p-8 text-center">
        <select
          value={selectedImportAccountId}
          onChange={(e) =>
            setSelectedImportAccountId(
              e.target.value ? Number(e.target.value) : ""
            )
          }
          className="mx-auto mb-4 w-full max-w-md rounded-xl border border-slate-300 px-3 py-2 text-sm"
        >
          <option value="">Selecione a conta bancária</option>
          {companyAccounts.map((account) => (
            <option key={account.id} value={account.id}>
              {account.bank} - {account.label}
            </option>
          ))}
        </select>

        <p className="text-sm font-medium">Selecione OFX, CSV ou CVS</p>
        <p className="mt-1 text-xs text-slate-500">
          Extrato e lançamentos do banco
        </p>

        <label className="mt-4 inline-flex cursor-pointer rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">
          Escolher arquivo
          <input
            type="file"
            accept=".ofx,.csv"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];

              if (!file) return;

              setSelectedFile(file.name);
              handleOfxUpload(file);
            }}
          />
        </label>

        {importMessage && (
          <div className="mx-auto mt-4 w-full max-w-md rounded-2xl border border-green-200 bg-green-50 p-4 text-center text-sm font-medium text-green-700">
            {importMessage}
          </div>
        )}

        {selectedFile ? (
          <p className="mt-3 text-xs text-slate-500">
            Último arquivo: {selectedFile}
          </p>
        ) : null}
      </div>
    </div>

    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 xl:col-span-2">
      <h3 className="text-lg font-semibold">Histórico de importações</h3>

      <div className="mt-5 space-y-3">
        {companyImports.length === 0 ? (
          <EmptyState text="Nenhuma importação para esta empresa." />
        ) : (
          companyImports.map((item) => (
            <div key={item.id} className="rounded-2xl bg-slate-50 p-4">
              <p className="font-semibold text-slate-900">{item.file}</p>
              <p className="mt-1 text-sm text-slate-500">Tipo: {item.type}</p>
              <p className="mt-1 text-sm text-slate-500">{item.status}</p>
            </div>
          ))
        )}
      </div>
    </div>
  </div>
);

  const renderFinanceForm = ({
    title,
    description,
    form,
    setForm,
    onSubmit,
    categories,
    usersList,
    actionText,
  }: {
    title: string;
    description: string;
    form: {
      description: string;
      amount: string;
      paymentType: string;
      dueDate: string;
      launchDate: string;
      user: string;
      category: string;
    };
    setForm: React.Dispatch<React.SetStateAction<any>>;
    onSubmit: (e: React.FormEvent) => void;
    categories: string[];
    usersList: UserAccess[];
    actionText: string;
  }) => (
    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <SectionTitle title={title} description={description} />
      <form onSubmit={onSubmit} className="mt-6 grid gap-3 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1 block text-sm text-slate-500">Descrição simples</label>
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-500">Valor</label>
          <input type="number" step="0.01" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-500">Tipo de pagamento</label>
          <select value={form.paymentType} onChange={(e) => setForm({ ...form, paymentType: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
            <option>PIX</option>
            <option>Boleto</option>
            <option>TED</option>
            <option>Transferência</option>
            <option>Cartão</option>
            <option>Dinheiro</option>
            <option>Débito em conta</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-500">Data de vencimento</label>
          <input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-500">Data de lançamento</label>
          <input type="date" value={form.launchDate} onChange={(e) => setForm({ ...form, launchDate: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-500">Usuário de lançamento</label>
          <select value={form.user} onChange={(e) => setForm({ ...form, user: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
            {usersList.map((user) => <option key={user.id}>{user.name}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm text-slate-500">Categoria</label>
          <select value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
            {categories.map((category) => <option key={category}>{category}</option>)}
          </select>
        </div>
        <div className="md:col-span-2">
          <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> {actionText}</button>
        </div>
      </form>
    </div>
  );

  const renderPagar = () => {
  const sortedPayables = [...companyPayables].sort(
    (a, b) =>
      new Date(b.launchDate).getTime() -
      new Date(a.launchDate).getTime()
  );

  return (
  <div className="space-y-6">
    {renderFinanceForm({
      title: "Contas a Pagar",
      description:
        "Lance despesas com descrição, valor, vencimento, tipo de pagamento e usuário.",
      form: payableForm,
      setForm: setPayableForm,
      onSubmit: addPayable,
      categories: expenseSubcategories,
      usersList: companyUsers,
      actionText: editingPayableId ? "Salvar despesa" : "Cadastrar despesa",
    })}

    <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h3 className="text-lg font-semibold">Despesas lançadas</h3>

      <div className="mt-5 overflow-x-auto">
        <table className="w-full min-w-[1180px] text-left text-sm">
          <thead>
            <tr className="border-b border-slate-200 text-slate-500">
              <th className="pb-3">Descrição</th>
              <th className="pb-3">Categoria</th>
              <th className="pb-3">Valor</th>
              <th className="pb-3">Pagamento</th>
              <th className="pb-3">Vencimento</th>
              <th className="pb-3">Lançamento</th>
              <th className="pb-3">Usuário</th>
              <th className="pb-3">Status</th>
              <th className="pb-3">Ações</th>
            </tr>
          </thead>

          <tbody>
            {companyPayables.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-6">
                  <EmptyState text="Nenhuma despesa lançada para esta empresa." />
                </td>
              </tr>
            ) : (
              sortedPayables.map((item) => (
                <tr key={item.id} className="border-b border-slate-100">
                  <td className="py-4 font-medium">{item.description}</td>
                  <td className="py-4">{item.category}</td>
                  <td className="py-4 font-medium text-rose-700">
                    {currency(item.amount)}
                  </td>
                  <td className="py-4">{item.paymentType}</td>
                  <td className="py-4">{formatDateBR(item.dueDate)}</td>
                  <td className="py-4">{formatDateBR(item.launchDate)}</td>
                  <td className="py-4">{item.userName ?? item.user}</td>

                  <td className="py-4">
                    <span
                      className={`rounded-lg px-3 py-1 text-xs font-medium ${
                        getStatus(item) === "PAGO"
                          ? "bg-green-100 text-green-700"
                          : getStatus(item) === "VENCIDO"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {getStatus(item) === "PAGO"
                        ? "Pago"
                        : getStatus(item) === "VENCIDO"
                        ? "Vencido"
                        : "Pendente"}
                    </span>
                  </td>

                  <td className="py-4">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => startEditPayable(item)}
                        className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        disabled={loadingId === item.id}
                        onClick={() => setConfirmDeleteId(item.id)}
                        className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700 disabled:opacity-50"
                      >
                        {loadingId === item.id ? "Excluindo..." : "Excluir"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>

    {confirmDeleteId !== null && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
        <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl">
          <h3 className="mb-2 text-lg font-semibold text-slate-900">
            Confirmar exclusão
          </h3>

          <p className="mb-6 text-sm text-slate-600">
            Tem certeza que deseja excluir essa despesa? Essa ação não poderá
            ser desfeita.
          </p>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmDeleteId(null)}
              className="rounded-lg border border-slate-300 px-4 py-2 text-sm text-slate-700"
            >
              Cancelar
            </button>

            <button
              type="button"
              onClick={async () => {
                const id = confirmDeleteId;
                if (!id) return;

                setLoadingId(id);

                const response = await fetch(`/api/payables/${id}`, {
                  method: "DELETE",
                  credentials: "include",
                });

                setLoadingId(null);
                setConfirmDeleteId(null);

                if (!response.ok) {
                  alert("Erro ao excluir despesa.");
                  return;
                }

                setPayables((current) =>
                  current.filter((p) => Number(p.id) !== Number(id))
                );
              }}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white"
            >
              Confirmar
            </button>
          </div>
        </div>
      </div>
    )}
  </div>
  );
};
  const renderReceber = () => (
    <div className="space-y-6">
      {renderFinanceForm({ title: "Contas a Receber", description: "Cadastre receitas esperadas para o sistema conciliar com o extrato importado.", form: receivableForm, setForm: setReceivableForm, onSubmit: addReceivable, categories: revenueSubcategories, usersList: companyUsers, actionText: editingReceivableId ? "Salvar receita" : "Cadastrar receita" })}
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold">Receitas lançadas</h3>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="pb-3">Descrição</th>
                <th className="pb-3">Categoria</th>
                <th className="pb-3">Valor</th>
                <th className="pb-3">Recebimento</th>
                <th className="pb-3">Vencimento</th>
                <th className="pb-3">Lançamento</th>
                <th className="pb-3">Usuário</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {companyReceivables.length === 0 ? (
                <tr><td colSpan={9} className="py-6"><EmptyState text="Nenhuma receita lançada para esta empresa." /></td></tr>
              ) : (
                companyReceivables.map((item) => (
                  <tr key={item.id} className="border-b border-slate-100">
                    <td className="py-4 font-medium">{item.description}</td>
                    <td className="py-4">{item.category}</td>
                    <td className="py-4 text-emerald-700 font-medium">{currency(item.amount)}</td>
                    <td className="py-4">{item.paymentType}</td>
                    <td className="py-4">{item.dueDate}</td>
                    <td className="py-4">{item.launchDate}</td>
                    <td className="py-4">{item.user}</td>
                    <td className="py-4"><Badge status={item.status} /></td>
                    <td className="py-4"><div className="flex gap-2"><button onClick={() => startEditReceivable(item)} className="rounded-xl border border-slate-300 px-3 py-2 text-xs font-medium text-slate-700"><Pencil className="h-4 w-4" /></button><button onClick={() => deleteReceivable(item.id)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700"><Trash2 className="h-4 w-4" /></button></div></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderCategorias = () => (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <SectionTitle title="Categorias Financeiras" description="Categorias e subcategorias em estrutura listada." />
          <form onSubmit={addCategory} className="mt-6 space-y-3">
            <select value={categoryForm.kind} onChange={(e) => setCategoryForm({ ...categoryForm, kind: e.target.value as "receita" | "despesa", groupId: "" })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
              <option value="receita">Categorias de receita</option>
              <option value="despesa">Categorias de despesa</option>
            </select>
            <select value={categoryForm.groupId} onChange={(e) => setCategoryForm({ ...categoryForm, groupId: e.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm">
              <option value="">Criar nova categoria principal</option>
              {categoryGroups.filter((group) => group.kind === categoryForm.kind).map((group) => <option key={group.id} value={group.id}>{group.code} {group.name}</option>)}
            </select>
            {!categoryForm.groupId ? <input value={categoryForm.groupName} onChange={(e) => setCategoryForm({ ...categoryForm, groupName: e.target.value })} placeholder="Nome da categoria principal" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" /> : null}
            <input value={categoryForm.subcategory} onChange={(e) => setCategoryForm({ ...categoryForm, subcategory: e.target.value })} placeholder="Subcategoria" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
            <button className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white"><Plus className="h-4 w-4" /> Incluir categoria</button>
          </form>
        </div>
        <div className="xl:col-span-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="grid gap-3 md:grid-cols-2 text-sm font-semibold text-slate-600">
            <div>Categorias de receita</div>
            <div>Categorias de despesa</div>
          </div>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            {[revenueGroups, expenseGroups].map((groups, idx) => (
              <div key={idx} className="space-y-2">
                {groups.map((group) => (
                  <div key={group.id} className="rounded-2xl border border-slate-200">
                    <button onClick={() => toggleGroup(group.id)} className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-slate-800">
                      <span className="flex items-center gap-3">
                        {expandedGroups[group.id] ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        {group.code} {group.name}
                      </span>
                      <Plus className="h-4 w-4 text-slate-400" />
                    </button>
                    {expandedGroups[group.id] ? (
                      <div className="border-t border-slate-200 px-4 py-3">
                        <div className="space-y-2">
                          {group.subcategories.length === 0 ? <p className="text-sm text-slate-400">Sem subcategorias.</p> : group.subcategories.map((sub) => <div key={sub} className="rounded-xl bg-slate-50 px-3 py-2 text-sm text-slate-700">{sub}</div>)}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderConciliacao = () => (
    <>
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <SectionTitle title="Conciliação Bancária" description="Pendências separadas por conta bancária da empresa ativa." />
        <button onClick={runAutoConciliation} className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow hover:opacity-95">Conciliar automaticamente</button>
      </header>
      <section className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-lg font-semibold">Fila de conciliação</h3>
              <p className="text-sm text-slate-500">Extrato importado cruzado com contas a pagar e a receber.</p>
            </div>
            <select value={selectedConciliationAccountId} onChange={(e) => setConciliationAccountId(e.target.value ? Number(e.target.value) : "")} className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm md:w-72">
              {companyAccounts.map((account) => <option key={account.id} value={account.id}>{account.bank} - {account.label}</option>)}
            </select>
          </div>
          <div className="mt-5 space-y-3">
            {conciliationTransactions.length === 0 ? (
              <EmptyState text="Tudo conciliado. Nenhuma pendência nesta conta." />
            ) : (
              conciliationTransactions.map((item) => {
                const linkedText = item.linkedType === "payable"
                  ? companyPayables.find((payable) => payable.id === item.linkedId)?.description
                  : companyReceivables.find((receivable) => receivable.id === item.linkedId)?.description;
                return (
                  <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                      <div>
                        <p className="font-semibold text-slate-900">{item.description}</p>
                        <p className="mt-1 text-sm text-slate-500">Conta: {companyAccounts.find((account) => account.id === item.bankAccountId)?.bank} • {item.date} • {currency(item.amount)}</p>
                        <p className="mt-2 text-sm text-slate-600">Pré-lançamento: {linkedText ?? "Sem correspondência interna"}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge status={item.status} />
                        <button onClick={() => reconcileTransaction(item.id)} className="rounded-xl bg-slate-900 px-3 py-2 text-xs font-medium text-white">Confirmar</button>
                        <button onClick={() => deleteTransaction(item.id)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-medium text-rose-700"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <h3 className="text-lg font-semibold">Resumo da conciliação</h3>
          <div className="mt-5 space-y-3">
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Conta selecionada</p><p className="mt-2 font-bold">{companyAccounts.find((account) => account.id === selectedConciliationAccountId)?.bank ?? "Sem conta"}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Pendentes</p><p className="mt-2 text-2xl font-bold">{conciliationTransactions.length}</p></div>
            <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Conciliados</p><p className="mt-2 text-2xl font-bold">{companyTransactions.filter((tx) => tx.bankAccountId === selectedConciliationAccountId && tx.status === "Conciliado").length}</p></div>
          </div>
        </div>
      </section>
    </>
  );

  const renderPendencias = () => (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <SectionTitle title="Pendências" description="Itens bancários ainda não conciliados." />
        <div className="mt-6 space-y-4">
          {companyTransactions.filter((item) => item.status !== "Conciliado").length === 0 ? (
            <EmptyState text="Sem pendências no momento." />
          ) : (
            companyTransactions
              .filter((item) => item.status !== "Conciliado")
              .map((item) => (
                <div key={item.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-semibold text-slate-900">{item.description}</p>
                      <p className="mt-1 text-sm text-slate-500">Conta: {companyAccounts.find((account) => account.id === item.bankAccountId)?.label} • Data: {item.date}</p>
                    </div>
                    <Badge status={item.status} />
                  </div>
                </div>
              ))
          )}
        </div>
      </div>
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold">Resumo</h3>
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Pendências totais</p><p className="mt-2 text-2xl font-bold">{companyTransactions.filter((item) => item.status !== "Conciliado").length}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Com sugestão</p><p className="mt-2 text-2xl font-bold">{companyTransactions.filter((item) => item.status === "Sugestão").length}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Manuais</p><p className="mt-2 text-2xl font-bold">{companyTransactions.filter((item) => item.status === "Pendente").length}</p></div>
        </div>
      </div>
    </div>
  );

  const renderRelatorios = () => (
    <div className="space-y-6">
      <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <SectionTitle title="Relatórios" description="Ao abrir, o fluxo de caixa já aparece como relatório principal." />
        <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[
            { key: "conciliacao", label: "Conciliação bancária" },
            { key: "fluxo-caixa", label: "Fluxo de caixa" },
            { key: "receitas-despesas", label: "Receitas x despesas" },
            { key: "contas-pagar", label: "Contas a pagar" },
            { key: "contas-receber", label: "Contas a receber" },
            { key: "vencimentos", label: "Vencimentos" },
          ].map((item) => (
            <button key={item.key} onClick={() => setActiveReport(item.key)} className={`flex items-center justify-between rounded-2xl border p-4 text-left ${activeReport === item.key ? "border-slate-900 ring-1 ring-slate-900" : "border-slate-200 hover:bg-slate-50"}`}>
              <span className="font-semibold text-slate-900">{item.label}</span>
              <Download className="h-4 w-4 text-slate-400" />
            </button>
          ))}
        </div>
      </div>

      {activeReport === "fluxo-caixa" ? (
        <>
          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
            <div className="flex items-center gap-2 text-lg font-semibold text-slate-800"><ChevronDown className="h-4 w-4" /> Fluxo de Caixa Mensal 2026 - Previsto e Realizado</div>
            <div className="mt-5 h-[360px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyReportData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `${Math.round(Number(value) / 1000)}k`} />
                  <Tooltip formatter={(value) => currency(Number(value))} />
                  <Legend />
                  <Bar dataKey="recebPrev" name="Recebimentos previstos" fill="#c7e9c0" />
                  <Bar dataKey="recebReal" name="Recebimentos realizados" fill="#16a34a" />
                  <Bar dataKey="pagPrev" name="Pagamentos previstos" fill="#fecdd3" />
                  <Bar dataKey="pagReal" name="Pagamentos realizados" fill="#f43f5e" />
                  <Line type="monotone" dataKey="saldoPrev" name="Saldo previsto" stroke="#9ca3af" strokeWidth={3} />
                  <Line type="monotone" dataKey="saldoReal" name="Saldo realizado" stroke="#1d4ed8" strokeWidth={3} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200 overflow-x-auto">
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="pb-3">Categorias de Lançamentos</th>
                  <th className="pb-3 text-center" colSpan={2}>Jan/2026</th>
                  <th className="pb-3 text-center" colSpan={2}>Fev/2026</th>
                  <th className="pb-3 text-center" colSpan={2}>Mar/2026</th>
                </tr>
                <tr className="border-b border-slate-200 text-slate-500">
                  <th className="py-3"></th>
                  <th className="py-3 text-center">Previsto</th>
                  <th className="py-3 text-center">Realizado</th>
                  <th className="py-3 text-center">Previsto</th>
                  <th className="py-3 text-center">Realizado</th>
                  <th className="py-3 text-center">Previsto</th>
                  <th className="py-3 text-center">Realizado</th>
                </tr>
              </thead>
              <tbody>
                {reportRows.map((row) => (
                  <tr key={row.label} className="border-b border-slate-100">
                    <td className="py-4 font-medium">{row.label}</td>
                    <td className="py-4 text-center">{currency(row.janPrev)}</td>
                    <td className="py-4 text-center">{currency(row.janReal)}</td>
                    <td className="py-4 text-center">{currency(row.fevPrev)}</td>
                    <td className="py-4 text-center">{currency(row.fevReal)}</td>
                    <td className="py-4 text-center">{currency(row.marPrev)}</td>
                    <td className="py-4 text-center">{currency(row.marReal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
          <p className="text-sm text-slate-500">Este layout está preparado para os demais relatórios. O fluxo de caixa abre por padrão.</p>
        </div>
      )}
    </div>
  );

  const renderConfiguracoes = () => (
    <div className="grid gap-6 xl:grid-cols-5">
      <div className="xl:col-span-3 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <SectionTitle title="Configurações" description="Configurações básicas do próprio acesso." />
        <form onSubmit={saveOwnSettings} className="mt-6 space-y-3 max-w-xl">
          <input value={ownSettings.name} onChange={(e) => setOwnSettings({ ...ownSettings, name: e.target.value })} placeholder="Nome" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <input value={ownSettings.email} onChange={(e) => setOwnSettings({ ...ownSettings, email: e.target.value })} placeholder="E-mail" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <input type="password" value={ownSettings.password} onChange={(e) => setOwnSettings({ ...ownSettings, password: e.target.value })} placeholder="Nova senha" className="w-full rounded-xl border border-slate-300 px-3 py-2 text-sm" />
          <button className="rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white">Salvar alterações</button>
        </form>
      </div>
      <div className="xl:col-span-2 rounded-3xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
        <h3 className="text-lg font-semibold">Resumo do acesso</h3>
        <div className="mt-5 space-y-3">
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Perfil</p><p className="mt-2 font-bold">{authUser?.category ?? "-"}</p></div>
          <div className="rounded-2xl bg-slate-50 p-4"><p className="text-sm text-slate-500">Empresa ativa</p><p className="mt-2 font-bold">{activeCompany?.name}</p></div>
        </div>
      </div>
    </div>
  );

  const renderPage = () => {
    switch (activePage) {
      case "dashboard":
        return renderDashboard();
      case "acessos":
        return renderAcessos();
      case "empresas":
        return renderEmpresas();
      case "contas":
        return renderContas();
      case "importacao":
        return renderImportacao();
      case "pagar":
        return renderPagar();
      case "receber":
        return renderReceber();
      case "categorias":
        return renderCategorias();
      case "conciliacao":
        return renderConciliacao();
      case "pendencias":
        return renderPendencias();
      case "relatorios":
        return renderRelatorios();
      case "configuracoes":
        return renderConfiguracoes();
      default:
        return renderDashboard();
    }
  };

  if (!authReady) {
    return <div className="flex min-h-screen items-center justify-center bg-slate-100 text-slate-500">Carregando...</div>;
  }

  if (!authUser) {
    return <LoginScreen error={authError} onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <div className="flex">
        <aside className="hidden md:flex w-72 min-h-screen flex-col border-r border-slate-200 bg-white p-6">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">FinConciliador</h1>
            <p className="mt-1 text-sm text-slate-500">Painel financeiro com conciliação</p>
          </div>

          <nav className="mt-10 space-y-2 text-sm">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePage === item.key;
              return (
                <button key={item.key} onClick={() => setActivePage(item.key)} className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left transition ${isActive ? "bg-slate-900 text-white shadow" : "text-slate-600 hover:bg-slate-100"}`}>
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto rounded-2xl bg-slate-100 p-4">
            <p className="text-sm font-semibold">Empresa ativa</p>
            <p className="mt-1 text-sm text-slate-600">{activeCompany?.name}</p>
            <p className="mt-1 text-xs text-slate-400">{activeCompany?.document}</p>
          </div>
        </aside>

        <main className="flex-1 p-6 md:p-10">
          <div className="mb-6 flex flex-col gap-3 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-slate-500">Usuário logado</p>
              <p className="font-semibold text-slate-900">{authUser.name}</p>
              <p className="text-xs text-slate-400">{authUser.category}</p>
            </div>
            <button onClick={handleLogout} className="rounded-2xl border border-slate-300 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Sair
            </button>
          </div>
          {renderPage()}
        </main>
      </div>
    </div>
  );
}
