/**
 * Projects Page — Main hub after login
 * Lists all projects, allows CRUD on projects and their products.
 * Clicking a product opens the MDB Builder.
 */
import { useAuth } from "@/contexts/AuthContext";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
import {
  getBrandingSettings,
  saveBrandingSettings,
  type BrandingSettings,
} from "@/lib/branding";
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
  type Project,
} from "@/lib/projects";
import {
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  type Product,
} from "@/lib/products";
import {
  ProductFormFields,
  type ProductForm,
  emptyProductForm,
  alignCustomUnitNumbers,
  countEmptyCustomUnitNumbers,
} from "@/components/ProductFormFields";
import {
  Plus,
  Trash2,
  Pencil,
  FolderOpen,
  Package,
  LogOut,
  ChevronRight,
  ArrowRight,
  X,
  Layers,
  LayoutGrid,
  Rows3,
  ArrowUpDown,
  Settings,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import BizzBitLogo from "@/components/BizzBitLogo";
import BrandColorPalette, { DEFAULT_BRAND_COLOR_PRESETS } from "@/components/BrandColorPalette";

const BRAND_COLOR_PRESETS = DEFAULT_BRAND_COLOR_PRESETS;

// ─── Form state helpers ──────────────────────────────────────────────────────

interface ProjectForm {
  projectNumber: string;
  projectName: string;
  customerName: string;
  customerProjectNumber: string;
}

const emptyProjectForm = (): ProjectForm => ({
  projectNumber: "",
  projectName: "",
  customerName: "",
  customerProjectNumber: "",
});

// ─── Main component ──────────────────────────────────────────────────────────

export default function Projects() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, navigate] = useLocation();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  // ── Project dialogs
  const [createProjectOpen, setCreateProjectOpen] = useState(false);
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectForm>(emptyProjectForm());
  const [projectFormBaseline, setProjectFormBaseline] = useState<ProjectForm | null>(null);
  const [savingProject, setSavingProject] = useState(false);

  // ── Products modal (open when clicking a project)
  const [productsOpen, setProductsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [projectView, setProjectView] = useState<"card" | "list">("card");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"updatedAt" | "projectNumber" | "projectName" | "customerName" | "products">("projectNumber");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");

  // ── Product dialogs
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm());
  const [productFormBaseline, setProductFormBaseline] = useState<ProductForm | null>(null);
  const [savingProduct, setSavingProduct] = useState(false);
  const [unsavedEditDialogOpen, setUnsavedEditDialogOpen] = useState(false);
  const [pendingEditModal, setPendingEditModal] = useState<
    "create-project" | "edit-project" | "create-product" | "edit-product" | null
  >(null);
  const [customUnitsValidationOpen, setCustomUnitsValidationOpen] = useState(false);
  const [customUnitsValidationMissing, setCustomUnitsValidationMissing] = useState(0);
  const [brandingOpen, setBrandingOpen] = useState(false);
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  const [brandingForm, setBrandingForm] = useState<BrandingSettings>({
    companyName: user?.company || null,
    logoUrl: null,
    primaryColor: "#3B82F6",
  });
  const [brandingBaseline, setBrandingBaseline] = useState<BrandingSettings | null>(null);
  const [welcomeBaseline, setWelcomeBaseline] = useState<BrandingSettings | null>(null);
  const [pendingUnsavedModal, setPendingUnsavedModal] = useState<"branding" | "welcome" | null>(null);
  const [unsavedSettingsDialogOpen, setUnsavedSettingsDialogOpen] = useState(false);
  const [savingBranding, setSavingBranding] = useState(false);
  const [brandingLogoDragActive, setBrandingLogoDragActive] = useState(false);
  const [welcomeLogoDragActive, setWelcomeLogoDragActive] = useState(false);

  // ── Load projects on mount (must be before auth guard early returns)
  useEffect(() => {
    if (!authLoading && user) {
      loadProjectsList();
      void loadBranding();
    }
  }, [authLoading, user]);

  async function loadBranding() {
    const { branding, error } = await getBrandingSettings();
    if (error) {
      toast.error("Failed to load branding settings", { description: error });
      return;
    }

    setBrandingForm({
      companyName: branding.companyName ?? user?.company ?? null,
      logoUrl: branding.logoUrl,
      primaryColor: branding.primaryColor,
      isFirstTime: branding.isFirstTime,
      marketingConsent: branding.marketingConsent,
    });

    const loadedBranding: BrandingSettings = {
      companyName: branding.companyName ?? user?.company ?? null,
      logoUrl: branding.logoUrl,
      primaryColor: branding.primaryColor,
      isFirstTime: branding.isFirstTime,
      marketingConsent: branding.marketingConsent,
    };
    setBrandingBaseline(loadedBranding);
    setWelcomeBaseline(loadedBranding);

    if (branding.isFirstTime) {
      setWelcomeBaseline(loadedBranding);
      setWelcomeOpen(true);
    }
  }

  const hasUnsavedBrandingChanges = useCallback((baseline: BrandingSettings | null) => {
    if (!baseline) return false;

    return (
      (brandingForm.companyName ?? "") !== (baseline.companyName ?? "") ||
      (brandingForm.logoUrl ?? null) !== (baseline.logoUrl ?? null) ||
      brandingForm.primaryColor !== baseline.primaryColor ||
      (brandingForm.marketingConsent ?? false) !== (baseline.marketingConsent ?? false)
    );
  }, [brandingForm]);

  const requestCloseBrandingModal = useCallback(() => {
    if (savingBranding) return;

    if (hasUnsavedBrandingChanges(brandingBaseline)) {
      setPendingUnsavedModal("branding");
      setUnsavedSettingsDialogOpen(true);
      return;
    }

    setBrandingOpen(false);
  }, [savingBranding, hasUnsavedBrandingChanges, brandingBaseline]);

  const requestCloseWelcomeModal = useCallback(() => {
    if (savingBranding) return;

    if (hasUnsavedBrandingChanges(welcomeBaseline)) {
      setPendingUnsavedModal("welcome");
      setUnsavedSettingsDialogOpen(true);
      return;
    }

    setWelcomeOpen(false);
  }, [savingBranding, hasUnsavedBrandingChanges, welcomeBaseline]);

  const discardUnsavedSettingsChanges = useCallback(() => {
    if (pendingUnsavedModal === "branding") {
      if (brandingBaseline) setBrandingForm(brandingBaseline);
      setBrandingOpen(false);
    }

    if (pendingUnsavedModal === "welcome") {
      if (welcomeBaseline) setBrandingForm(welcomeBaseline);
      setWelcomeOpen(false);
    }

    setUnsavedSettingsDialogOpen(false);
    setPendingUnsavedModal(null);
  }, [pendingUnsavedModal, brandingBaseline, welcomeBaseline]);

  async function handleSaveWelcomeBranding() {
    setSavingBranding(true);
    const { branding, error } = await saveBrandingSettings({
      companyName: brandingForm.companyName?.trim() || null,
      logoUrl: brandingForm.logoUrl,
      primaryColor: brandingForm.primaryColor,
      isFirstTime: false,
      marketingConsent: brandingForm.marketingConsent ?? false,
    });
    setSavingBranding(false);

    if (error || !branding) {
      toast.error("Failed to save branding settings", { description: error ?? undefined });
      return;
    }

    setBrandingForm(branding);
    setBrandingBaseline(branding);
    setWelcomeBaseline(branding);
    setWelcomeOpen(false);
    toast.success("Welcome setup saved");
  }

  async function handleSkipWelcome() {
    // Persist a settings row so the welcome appears only once.
    const { branding } = await saveBrandingSettings({
      companyName: brandingForm.companyName?.trim() || null,
      logoUrl: brandingForm.logoUrl,
      primaryColor: brandingForm.primaryColor,
      isFirstTime: false,
      marketingConsent: false,
    });
    if (branding) {
      setBrandingForm(branding);
      setBrandingBaseline(branding);
      setWelcomeBaseline(branding);
    }
    setWelcomeOpen(false);
  }

  async function loadProjectsList() {
    setLoadingProjects(true);
    const { projects: p, error } = await listProjects();
    if (error) toast.error("Failed to load projects", { description: error });
    else setProjects(p);
    setLoadingProjects(false);
  }

  const visibleProjects = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = q
      ? projects.filter((project) => {
          return (
            project.projectNumber.toLowerCase().includes(q) ||
            project.projectName.toLowerCase().includes(q) ||
            project.customerName.toLowerCase().includes(q) ||
            (project.customerProjectNumber || "").toLowerCase().includes(q)
          );
        })
      : projects;

    const sorted = [...filtered].sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      if (sortBy === "products") {
        return ((a._count?.products ?? 0) - (b._count?.products ?? 0)) * direction;
      }

      if (sortBy === "updatedAt") {
        return (
          (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * direction
        );
      }

      const aValue = (a[sortBy] || "").toString().toLowerCase();
      const bValue = (b[sortBy] || "").toString().toLowerCase();
      if (aValue < bValue) return -1 * direction;
      if (aValue > bValue) return 1 * direction;
      return 0;
    });

    return sorted;
  }, [projects, searchQuery, sortBy, sortDirection]);

  // Auth guard
  if (authLoading) return null;
  if (!user) {
    navigate("/");
    return null;
  }

  // ── Open products modal
  async function handleOpenProject(project: Project) {
    setSelectedProject(project);
    setProducts([]);
    setProductsOpen(true);
    setLoadingProducts(true);
    const { products: p, error } = await listProducts(project.id);
    if (error) toast.error("Failed to load products", { description: error });
    else setProducts(p);
    setLoadingProducts(false);
  }

  // ── Project create/edit ──────────────────────────────────────────────────

  function openCreateProject() {
    const initialProjectForm = emptyProjectForm();
    setProjectForm(initialProjectForm);
    setProjectFormBaseline(initialProjectForm);
    setCreateProjectOpen(true);
  }

  function openEditProject(project: Project) {
    setEditingProject(project);
    const initialProjectForm: ProjectForm = {
      projectNumber: project.projectNumber,
      projectName: project.projectName,
      customerName: project.customerName,
      customerProjectNumber: project.customerProjectNumber ?? "",
    };
    setProjectForm(initialProjectForm);
    setProjectFormBaseline(initialProjectForm);
    setEditProjectOpen(true);
  }

  function hasProjectFormUnsavedChanges() {
    if (!projectFormBaseline) return false;
    return JSON.stringify(projectForm) !== JSON.stringify(projectFormBaseline);
  }

  async function handleCreateProject() {
    if (!projectForm.projectNumber.trim() || !projectForm.projectName.trim() || !projectForm.customerName.trim()) {
      toast.error("Project number, name, and customer name are required");
      return;
    }
    setSavingProject(true);
    const { project, error } = await createProject({
      projectNumber: projectForm.projectNumber.trim(),
      projectName: projectForm.projectName.trim(),
      customerName: projectForm.customerName.trim(),
      customerProjectNumber: projectForm.customerProjectNumber.trim() || undefined,
    });
    setSavingProject(false);
    if (error || !project) {
      toast.error("Failed to create project", { description: error ?? undefined });
      return;
    }
    setProjects((prev) => [project, ...prev]);
    setCreateProjectOpen(false);
    toast.success(`Project "${project.projectName}" created`);
  }

  async function handleUpdateProject() {
    if (!editingProject) return;
    if (!projectForm.projectNumber.trim() || !projectForm.projectName.trim() || !projectForm.customerName.trim()) {
      toast.error("Project number, name, and customer name are required");
      return;
    }
    setSavingProject(true);
    const { project, error } = await updateProject(editingProject.id, {
      projectNumber: projectForm.projectNumber.trim(),
      projectName: projectForm.projectName.trim(),
      customerName: projectForm.customerName.trim(),
      customerProjectNumber: projectForm.customerProjectNumber.trim() || null,
    });
    setSavingProject(false);
    if (error || !project) {
      toast.error("Failed to update project", { description: error ?? undefined });
      return;
    }
    setProjects((prev) => prev.map((p) => (p.id === project.id ? project : p)));
    setEditProjectOpen(false);
    toast.success("Project updated");
  }

  async function handleDeleteProject(project: Project) {
    if (!confirm(`Delete project "${project.projectName}" and all its products? This cannot be undone.`)) return;
    const { error } = await deleteProject(project.id);
    if (error) {
      toast.error("Failed to delete project", { description: error });
      return;
    }
    setProjects((prev) => prev.filter((p) => p.id !== project.id));
    toast.success(`Project "${project.projectName}" deleted`);
  }

  // ── Product create/edit ──────────────────────────────────────────────────

  function openCreateProduct() {
    const initialProductForm = emptyProductForm();
    setProductForm(initialProductForm);
    setProductFormBaseline(initialProductForm);
    setCreateProductOpen(true);
  }

  function openEditProduct(product: Product) {
    setEditingProduct(product);
    const resolvedUnitCount = product.unitsEnabled ? Math.max(1, product.unitCount) : 1;
    const resolvedCustomNumbers =
      product.unitsEnabled && product.unitNumberingMode === "custom"
        ? alignCustomUnitNumbers(product.customUnitNumbers ?? [], resolvedUnitCount)
        : [];

    const initialProductForm: ProductForm = {
      productName: product.productName,
      tagNumber: product.tagNumber ?? "",
      mdbDocumentNumber: product.mdbDocumentNumber ?? "",
      unitsEnabled: product.unitsEnabled,
      unitCount: resolvedUnitCount,
      unitNumberingMode: product.unitsEnabled ? product.unitNumberingMode : "auto",
      unitNumberPrefix: product.unitsEnabled ? (product.unitNumberPrefix ?? "") : "",
      customUnitNumbers: resolvedCustomNumbers,
    };
    setProductForm(initialProductForm);
    setProductFormBaseline(initialProductForm);
    setEditProductOpen(true);
  }

  function hasProductFormUnsavedChanges() {
    if (!productFormBaseline) return false;
    return JSON.stringify(productForm) !== JSON.stringify(productFormBaseline);
  }

  function requestCloseEditModal(modal: "create-project" | "edit-project" | "create-product" | "edit-product") {
    if ((modal === "create-project" || modal === "edit-project") && savingProject) return;
    if ((modal === "create-product" || modal === "edit-product") && savingProduct) return;

    const hasUnsavedChanges =
      modal === "create-project" || modal === "edit-project"
        ? hasProjectFormUnsavedChanges()
        : hasProductFormUnsavedChanges();

    if (hasUnsavedChanges) {
      setPendingEditModal(modal);
      setUnsavedEditDialogOpen(true);
      return;
    }

    if (modal === "create-project") setCreateProjectOpen(false);
    if (modal === "edit-project") setEditProjectOpen(false);
    if (modal === "create-product") setCreateProductOpen(false);
    if (modal === "edit-product") setEditProductOpen(false);
  }

  function discardEditModalChanges() {
    if (pendingEditModal === "create-project") {
      if (projectFormBaseline) setProjectForm(projectFormBaseline);
      setCreateProjectOpen(false);
    }
    if (pendingEditModal === "edit-project") {
      if (projectFormBaseline) setProjectForm(projectFormBaseline);
      setEditProjectOpen(false);
    }
    if (pendingEditModal === "create-product") {
      if (productFormBaseline) setProductForm(productFormBaseline);
      setCreateProductOpen(false);
    }
    if (pendingEditModal === "edit-product") {
      if (productFormBaseline) setProductForm(productFormBaseline);
      setEditProductOpen(false);
    }

    setUnsavedEditDialogOpen(false);
    setPendingEditModal(null);
  }

  async function handleCreateProduct() {
    if (!selectedProject) return;
    if (!productForm.productName.trim()) {
      toast.error("Product name is required");
      return;
    }

    const unitCount = Math.max(1, Math.min(500, Number(productForm.unitCount) || 1));
    const customUnitNumbers = productForm.customUnitNumbers
      .slice(0, unitCount)
      .map((value) => value.trim());
    const emptyCustomUnitCount = countEmptyCustomUnitNumbers(productForm);

    if (productForm.unitsEnabled && productForm.unitNumberingMode === "custom") {
      if (emptyCustomUnitCount > 0) {
        setCustomUnitsValidationMissing(emptyCustomUnitCount);
        setCustomUnitsValidationOpen(true);
        return;
      }
      if (new Set(customUnitNumbers).size !== customUnitNumbers.length) {
        toast.error("Unit numbers must be unique");
        return;
      }
    }

    setSavingProduct(true);
    const { product, error } = await createProduct({
      projectId: selectedProject.id,
      productName: productForm.productName.trim(),
      tagNumber: productForm.tagNumber.trim() || null,
      mdbDocumentNumber: productForm.mdbDocumentNumber.trim() || null,
      unitsEnabled: productForm.unitsEnabled,
      unitCount: productForm.unitsEnabled ? unitCount : 1,
      unitNumberingMode: productForm.unitsEnabled ? productForm.unitNumberingMode : "auto",
      unitNumberPrefix:
        productForm.unitsEnabled && productForm.unitNumberingMode !== "custom"
          ? (productForm.unitNumberPrefix.trim() || null)
          : null,
      customUnitNumbers:
        productForm.unitsEnabled && productForm.unitNumberingMode === "custom"
          ? customUnitNumbers
          : null,
    });
    setSavingProduct(false);
    if (error || !product) {
      toast.error("Failed to create product", { description: error ?? undefined });
      return;
    }
    setProducts((prev) => [product, ...prev]);
    // Update product count in the project list
    setProjects((prev) =>
      prev.map((p) =>
        p.id === selectedProject.id
          ? { ...p, _count: { products: (p._count?.products ?? 0) + 1 } }
          : p
      )
    );
    setCreateProductOpen(false);
    setProductsOpen(false);
    toast.success(`Product "${product.productName}" created`);
    navigate(`/builder/${product.id}`);
  }

  async function handleUpdateProduct() {
    if (!editingProduct) return;
    if (!productForm.productName.trim()) {
      toast.error("Product name is required");
      return;
    }

    const unitCount = Math.max(1, Math.min(500, Number(productForm.unitCount) || 1));
    const customUnitNumbers = productForm.customUnitNumbers
      .slice(0, unitCount)
      .map((value) => value.trim());
    const emptyCustomUnitCount = countEmptyCustomUnitNumbers(productForm);

    if (productForm.unitsEnabled && productForm.unitNumberingMode === "custom") {
      if (emptyCustomUnitCount > 0) {
        setCustomUnitsValidationMissing(emptyCustomUnitCount);
        setCustomUnitsValidationOpen(true);
        return;
      }
      if (new Set(customUnitNumbers).size !== customUnitNumbers.length) {
        toast.error("Unit numbers must be unique");
        return;
      }
    }

    setSavingProduct(true);
    const { product, error } = await updateProduct(editingProduct.id, {
      productName: productForm.productName.trim(),
      tagNumber: productForm.tagNumber.trim() || null,
      mdbDocumentNumber: productForm.mdbDocumentNumber.trim() || null,
      unitsEnabled: productForm.unitsEnabled,
      unitCount: productForm.unitsEnabled ? unitCount : 1,
      unitNumberingMode: productForm.unitsEnabled ? productForm.unitNumberingMode : "auto",
      unitNumberPrefix:
        productForm.unitsEnabled && productForm.unitNumberingMode !== "custom"
          ? (productForm.unitNumberPrefix.trim() || null)
          : null,
      customUnitNumbers:
        productForm.unitsEnabled && productForm.unitNumberingMode === "custom"
          ? customUnitNumbers
          : null,
    });
    setSavingProduct(false);
    if (error || !product) {
      toast.error("Failed to update product", { description: error ?? undefined });
      return;
    }
    setProducts((prev) => prev.map((p) => (p.id === product.id ? product : p)));
    setEditProductOpen(false);
    toast.success("Product updated");
  }

  async function handleDeleteProduct(product: Product) {
    if (!confirm(`Delete product "${product.productName}" (${product.tagNumber})? This cannot be undone.`)) return;
    const { error } = await deleteProduct(product.id);
    if (error) {
      toast.error("Failed to delete product", { description: error });
      return;
    }
    setProducts((prev) => prev.filter((p) => p.id !== product.id));
    if (selectedProject) {
      setProjects((prev) =>
        prev.map((p) =>
          p.id === selectedProject.id
            ? { ...p, _count: { products: Math.max(0, (p._count?.products ?? 1) - 1) } }
            : p
        )
      );
    }
    toast.success(`Product "${product.productName}" deleted`);
  }

  async function handleSaveBranding() {
    setSavingBranding(true);
    const { branding, error } = await saveBrandingSettings({
      companyName: brandingForm.companyName?.trim() || null,
      logoUrl: brandingForm.logoUrl,
      primaryColor: brandingForm.primaryColor,
      marketingConsent: brandingForm.marketingConsent,
    });
    setSavingBranding(false);

    if (error || !branding) {
      toast.error("Failed to save branding settings", { description: error ?? undefined });
      return;
    }

    setBrandingForm(branding);
    setBrandingBaseline(branding);
    setBrandingOpen(false);
    toast.success("Branding settings saved");
  }

  function handleBrandingLogoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setBrandingForm((prev) => ({ ...prev, logoUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BizzBitLogo textSizeClassName="text-2xl" className="h-8" />
            <span className="text-muted-foreground text-sm font-[var(--font-mono)] tracking-wide">
              MDB Builder
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => {
                setBrandingBaseline(brandingForm);
                setBrandingOpen(true);
              }}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Button>
            <ThemeToggle />
            <span className="text-sm text-muted-foreground hidden sm:block">{user.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { logout(); navigate("/"); }}
              className="gap-1.5"
            >
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Projects</h1>
            <p className="text-muted-foreground mt-1">
              Select a project to manage its products and MDB documents.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center rounded-lg border border-border/60 bg-card/60 p-1">
              <Button
                type="button"
                variant={projectView === "card" ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5 h-8 px-3"
                onClick={() => setProjectView("card")}
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Cards
              </Button>
              <Button
                type="button"
                variant={projectView === "list" ? "secondary" : "ghost"}
                size="sm"
                className="gap-1.5 h-8 px-3"
                onClick={() => setProjectView("list")}
              >
                <Rows3 className="h-3.5 w-3.5" />
                List
              </Button>
            </div>
            <Button onClick={openCreateProject} className="gap-2">
              <Plus className="h-4 w-4" />
              New Project
            </Button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center mb-6">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by project no., name, customer, or customer project no."
            className="sm:max-w-md bg-input/50"
          />
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-2 py-1.5">
              <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                className="h-7 rounded bg-transparent text-sm outline-none"
              >
                <option value="updatedAt">Last Updated</option>
                <option value="projectNumber">Project Number</option>
                <option value="projectName">Project Name</option>
                <option value="customerName">Customer</option>
                <option value="products">Products</option>
              </select>
              <select
                value={sortDirection}
                onChange={(e) => setSortDirection(e.target.value as typeof sortDirection)}
                className="h-7 rounded bg-transparent text-sm outline-none"
              >
                <option value="asc">Asc</option>
                <option value="desc">Desc</option>
              </select>
            </div>
          </div>
        </div>

        {loadingProjects ? (
          <div className="flex items-center justify-center py-20 text-muted-foreground">
            <span className="h-6 w-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-3" />
            Loading projects…
          </div>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <FolderOpen className="h-8 w-8 text-primary/60" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-xs">
              Create your first project to start building Manufacturing Data Book structures.
            </p>
            <Button onClick={openCreateProject} className="gap-2">
              <Plus className="h-4 w-4" />
              Create First Project
            </Button>
          </div>
        ) : visibleProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <p className="text-sm font-medium mb-1">No matching projects</p>
            <p className="text-xs text-muted-foreground">Try a different search term.</p>
          </div>
        ) : projectView === "card" ? (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleProjects.map((project) => (
              <div
                key={project.id}
                className="group relative flex flex-col p-5 rounded-xl border border-border/50 bg-card/50 hover:border-primary/30 hover:bg-card transition-all duration-200 cursor-pointer"
                onClick={() => handleOpenProject(project)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                      <FolderOpen className="h-4.5 w-4.5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="font-[var(--font-mono)] text-xs text-muted-foreground">
                        {project.projectNumber}
                      </div>
                      <div className="font-semibold truncate text-sm leading-tight">
                        {project.projectName}
                      </div>
                    </div>
                  </div>
                  {/* Action buttons — visible on hover */}
                  <div
                    className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                      onClick={() => openEditProject(project)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                    <button
                      className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      onClick={() => handleDeleteProject(project)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Customer */}
                <div className="text-xs text-muted-foreground mb-1">
                  <span className="text-muted-foreground/60">Customer: </span>
                  {project.customerName}
                </div>
                {project.customerProjectNumber && (
                  <div className="text-xs text-muted-foreground mb-1">
                    <span className="text-muted-foreground/60">Customer project no.: </span>
                    {project.customerProjectNumber}
                  </div>
                )}

                {/* Footer */}
                <div className="mt-auto pt-3 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Package className="h-3.5 w-3.5" />
                    {project._count?.products ?? 0} product{(project._count?.products ?? 0) !== 1 ? "s" : ""}
                  </div>
                  <div className="flex items-center gap-1 text-xs text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Open
                    <ChevronRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-border/50 bg-card/40 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/40 border-b border-border/50">
                  <tr className="text-left text-xs uppercase tracking-wider text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Project</th>
                    <th className="px-4 py-3 font-medium">Customer</th>
                    <th className="px-4 py-3 font-medium">Customer Project #</th>
                    <th className="px-4 py-3 font-medium">Products</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleProjects.map((project) => (
                    <tr
                      key={project.id}
                      className="border-b border-border/40 hover:bg-accent/20 cursor-pointer"
                      onClick={() => handleOpenProject(project)}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                            <FolderOpen className="h-4 w-4 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-[var(--font-mono)] text-xs text-muted-foreground">
                              {project.projectNumber}
                            </div>
                            <div className="font-medium truncate max-w-[260px]">
                              {project.projectName}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{project.customerName}</td>
                      <td className="px-4 py-3 text-muted-foreground font-[var(--font-mono)]">
                        {project.customerProjectNumber || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="inline-flex items-center gap-1.5 text-muted-foreground">
                          <Package className="h-3.5 w-3.5" />
                          {project._count?.products ?? 0}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
                            onClick={() => openEditProject(project)}
                            title="Edit project"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            onClick={() => handleDeleteProject(project)}
                            title="Delete project"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ── Create Project Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={createProjectOpen}
        onOpenChange={(open) => {
          if (open) {
            setCreateProjectOpen(true);
            return;
          }
          requestCloseEditModal("create-project");
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Create a new project to group your MDB products under.
            </DialogDescription>
          </DialogHeader>
          <ProjectFormFields form={projectForm} onChange={setProjectForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => requestCloseEditModal("create-project")}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={savingProject}>
              {savingProject ? "Creating…" : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Project Dialog ───────────────────────────────────────────── */}
      <Dialog
        open={editProjectOpen}
        onOpenChange={(open) => {
          if (open) {
            setEditProjectOpen(true);
            return;
          }
          requestCloseEditModal("edit-project");
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <ProjectFormFields form={projectForm} onChange={setProjectForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => requestCloseEditModal("edit-project")}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProject} disabled={savingProject}>
              {savingProject ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Products Modal ────────────────────────────────────────────────── */}
      <Dialog open={productsOpen} onOpenChange={setProductsOpen}>
        <DialogContent className="sm:max-w-2xl bg-card border-border max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-start justify-between pr-6">
              <div>
                <DialogTitle className="text-lg">
                  {selectedProject?.projectName}
                </DialogTitle>
                <DialogDescription className="mt-0.5">
                  <span className="font-[var(--font-mono)] text-xs">{selectedProject?.projectNumber}</span>
                  {" · "}
                  {selectedProject?.customerName}
                  {selectedProject?.customerProjectNumber && (
                    <> · Customer project: {selectedProject.customerProjectNumber}</>
                  )}
                </DialogDescription>
              </div>
              <Button size="sm" onClick={openCreateProduct} className="gap-1.5 shrink-0 mt-0.5">
                <Plus className="h-3.5 w-3.5" />
                Add Product
              </Button>
            </div>
          </DialogHeader>

          <ScrollArea className="flex-1 min-h-0 -mx-6 px-6">
            {loadingProducts ? (
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <span className="h-5 w-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
                Loading…
              </div>
            ) : products.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-3">
                  <Package className="h-6 w-6 text-primary/60" />
                </div>
                <p className="text-sm font-medium mb-1">No products yet</p>
                <p className="text-xs text-muted-foreground mb-4">
                  Add a product (equipment item / tag) to start building its MDB.
                </p>
                <Button size="sm" onClick={openCreateProduct} className="gap-1.5">
                  <Plus className="h-3.5 w-3.5" />
                  Add First Product
                </Button>
              </div>
            ) : (
              <div className="space-y-2 py-1">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="group flex items-center gap-4 p-4 rounded-lg border border-border/50 bg-card/30 hover:border-border transition-colors"
                  >
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Layers className="h-4 w-4 text-primary/70" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{product.productName}</div>
                      <div className="flex items-center gap-3 mt-0.5 text-xs text-muted-foreground">
                        <span className="font-[var(--font-mono)]">Tag: {product.tagNumber || "-"}</span>
                        <span className="font-[var(--font-mono)]">Doc: {product.mdbDocumentNumber || "-"}</span>
                        {product.unitsEnabled && (
                          <span>
                            Units: {product.unitCount} ({product.unitNumberingMode === "custom" ? "custom" : "auto"})
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        className="p-1.5 rounded-md text-muted-foreground/50 hover:text-foreground hover:bg-accent transition-colors opacity-0 group-hover:opacity-100"
                        onClick={() => openEditProduct(product)}
                        title="Edit product"
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      <button
                        className="p-1.5 rounded-md text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 transition-colors opacity-0 group-hover:opacity-100"
                        onClick={() => handleDeleteProduct(product)}
                        title="Delete product"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                      <Button
                        size="sm"
                        className="gap-1.5 h-8"
                        onClick={() => {
                          setProductsOpen(false);
                          navigate(`/builder/${product.id}`);
                        }}
                      >
                        Open MDB
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* ── Create Product Dialog ─────────────────────────────────────────── */}
      <Dialog
        open={createProductOpen}
        onOpenChange={(open) => {
          if (open) {
            setCreateProductOpen(true);
            return;
          }
          requestCloseEditModal("create-product");
        }}
      >
        <DialogContent
          className={`${
            productForm.unitsEnabled && productForm.unitNumberingMode === "custom"
              ? "sm:max-w-4xl"
              : "sm:max-w-md"
          } bg-card border-border`}
        >
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>
              A product represents a single equipment item or tag that will have its own MDB.
            </DialogDescription>
          </DialogHeader>
          <ProductFormFields form={productForm} onChange={setProductForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => requestCloseEditModal("create-product")}>
              Cancel
            </Button>
            <Button onClick={handleCreateProduct} disabled={savingProduct}>
              {savingProduct ? "Creating…" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Product Dialog ───────────────────────────────────────────── */}
      <Dialog
        open={editProductOpen}
        onOpenChange={(open) => {
          if (open) {
            setEditProductOpen(true);
            return;
          }
          requestCloseEditModal("edit-product");
        }}
      >
        <DialogContent
          className={`${
            productForm.unitsEnabled && productForm.unitNumberingMode === "custom"
              ? "sm:max-w-4xl"
              : "sm:max-w-md"
          } bg-card border-border`}
        >
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <ProductFormFields form={productForm} onChange={setProductForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => requestCloseEditModal("edit-product")}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProduct} disabled={savingProduct}>
              {savingProduct ? "Saving…" : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={unsavedEditDialogOpen}
        onOpenChange={(open) => {
          setUnsavedEditDialogOpen(open);
          if (!open) setPendingEditModal(null);
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Unsaved changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Do you want to save before closing?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUnsavedEditDialogOpen(false);
                setPendingEditModal(null);
              }}
            >
              Continue editing
            </Button>
            <Button
              onClick={async () => {
                setUnsavedEditDialogOpen(false);
                const targetModal = pendingEditModal;
                setPendingEditModal(null);

                if (targetModal === "create-project") {
                  await handleCreateProject();
                  return;
                }
                if (targetModal === "edit-project") {
                  await handleUpdateProject();
                  return;
                }
                if (targetModal === "create-product") {
                  await handleCreateProduct();
                  return;
                }
                if (targetModal === "edit-product") {
                  await handleUpdateProduct();
                }
              }}
              disabled={savingProject || savingProduct}
            >
              {savingProject || savingProduct ? "Saving..." : "Save and close"}
            </Button>
            <Button variant="destructive" onClick={discardEditModalChanges}>
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={brandingOpen}
        onOpenChange={(open) => {
          if (open) {
            setBrandingBaseline(brandingForm);
            setBrandingOpen(true);
            return;
          }
          requestCloseBrandingModal();
        }}
      >
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <DialogTitle>Branding Settings</DialogTitle>
            <DialogDescription>
              These branding settings apply to all MDB exports for your account.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div>
              <Label className="text-sm mb-1.5 block">Company Name</Label>
              <Input
                value={brandingForm.companyName ?? ""}
                onChange={(e) => setBrandingForm((prev) => ({ ...prev, companyName: e.target.value || null }))}
                placeholder="e.g. BizzBit Engineering"
                className="bg-input/50"
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Company Logo</Label>
              {brandingForm.logoUrl ? (
                <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <img src={brandingForm.logoUrl} alt="Company logo" className="h-12 max-w-32 object-contain bg-white rounded p-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBrandingForm((prev) => ({ ...prev, logoUrl: null }))}
                  >
                    Remove Logo
                  </Button>
                </div>
              ) : (
                <label
                  className={`flex h-20 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors text-sm ${
                    brandingLogoDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/10 text-muted-foreground hover:border-primary/50 hover:text-primary"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setBrandingLogoDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setBrandingLogoDragActive(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setBrandingLogoDragActive(false);
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      const file = files[0];
                      if (file.type.startsWith("image/")) {
                        const syntheticEvent = {
                          target: { files: files },
                        } as unknown as React.ChangeEvent<HTMLInputElement>;
                        handleBrandingLogoUpload(syntheticEvent);
                      } else {
                        toast.error("Please drop an image file");
                      }
                    }
                  }}
                >
                  <input type="file" accept="image/*" className="hidden" onChange={handleBrandingLogoUpload} />
                  {brandingLogoDragActive ? "Drop logo here" : "Upload Logo"}
                </label>
              )}
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Primary Brand Color</Label>
              <BrandColorPalette
                value={brandingForm.primaryColor}
                onChange={(color) => setBrandingForm((prev) => ({ ...prev, primaryColor: color }))}
                presets={BRAND_COLOR_PRESETS}
              />
            </div>
            <div className="pt-2 border-t border-border/50">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={brandingForm.marketingConsent ?? false}
                  onChange={(e) => setBrandingForm((prev) => ({ ...prev, marketingConsent: e.target.checked }))}
                  className="h-4 w-4 rounded border-input mt-1 flex-shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground font-medium">Marketing Communications</div>
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    I'd like to receive occasional updates about the BizzBit platform and new features. You can unsubscribe at any time.
                  </div>
                </div>
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={requestCloseBrandingModal}>
              Cancel
            </Button>
            <Button onClick={handleSaveBranding} disabled={savingBranding}>
              {savingBranding ? "Saving..." : "Save Settings"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={welcomeOpen}
        onOpenChange={(open) => {
          if (open) {
            setWelcomeBaseline(brandingForm);
            setWelcomeOpen(true);
            return;
          }
          requestCloseWelcomeModal();
        }}
      >
        <DialogContent className="sm:max-w-lg bg-card border-border">
          <DialogHeader>
            <div className="flex items-center gap-2 mb-2">
              <BizzBitLogo textSizeClassName="text-2xl" className="h-8" />
            </div>
            <DialogTitle>Welcome to MDB Builder</DialogTitle>
            <DialogDescription>
              Great to have you here. Set up your branding now so all exports match your company identity.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-1">
            <div>
              <Label className="text-sm mb-1.5 block">Company Name</Label>
              <Input
                value={brandingForm.companyName ?? ""}
                onChange={(e) => setBrandingForm((prev) => ({ ...prev, companyName: e.target.value || null }))}
                placeholder="e.g. BizzBit Engineering"
                className="bg-input/50"
              />
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Company Logo</Label>
              {brandingForm.logoUrl ? (
                <div className="flex items-center gap-3 rounded-lg border border-border/60 bg-muted/20 p-3">
                  <img src={brandingForm.logoUrl} alt="Company logo" className="h-12 max-w-32 object-contain bg-white rounded p-1" />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setBrandingForm((prev) => ({ ...prev, logoUrl: null }))}
                  >
                    Remove Logo
                  </Button>
                </div>
              ) : (
                <label
                  className={`flex h-20 cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors text-sm ${
                    welcomeLogoDragActive
                      ? "border-primary bg-primary/5"
                      : "border-border bg-muted/10 text-muted-foreground hover:border-primary/50 hover:text-primary"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setWelcomeLogoDragActive(true);
                  }}
                  onDragLeave={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setWelcomeLogoDragActive(false);
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setWelcomeLogoDragActive(false);
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      const file = files[0];
                      if (file.type.startsWith("image/")) {
                        const syntheticEvent = {
                          target: { files: files },
                        } as unknown as React.ChangeEvent<HTMLInputElement>;
                        handleBrandingLogoUpload(syntheticEvent);
                      } else {
                        toast.error("Please drop an image file");
                      }
                    }
                  }}
                >
                  <input type="file" accept="image/*" className="hidden" onChange={handleBrandingLogoUpload} />
                  {welcomeLogoDragActive ? "Drop logo here" : "Upload Logo"}
                </label>
              )}
            </div>
            <div>
              <Label className="text-sm mb-1.5 block">Primary Brand Color</Label>
              <BrandColorPalette
                value={brandingForm.primaryColor}
                onChange={(color) => setBrandingForm((prev) => ({ ...prev, primaryColor: color }))}
                presets={BRAND_COLOR_PRESETS}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              You can always change these branding settings later from the Settings button in the navbar.
            </p>
              <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5">
                <div className="flex items-start gap-2.5">
                  <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium mb-0.5">This is the free BizzBit Builder</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      The full BizzBit platform adds MDB content management, digital ITP, supplier &amp; customer
                      communication, ISO 9001 NCR tracking, checklists, and much more.{" "}
                      <a
                        href="https://www.bizzbit.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-0.5"
                      >
                        Visit bizzbit.com <ExternalLink className="h-3 w-3" />
                      </a>
                    </p>
                  </div>
                </div>
              </div>
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={brandingForm.marketingConsent ?? false}
                  onChange={(e) => setBrandingForm((prev) => ({ ...prev, marketingConsent: e.target.checked }))}
                  className="mt-0.5 h-4 w-4 rounded border-input accent-primary shrink-0"
                />
                <span className="text-xs text-muted-foreground leading-relaxed">
                  I'd like to receive occasional updates about the BizzBit platform and new features.
                  You can unsubscribe at any time.
                </span>
              </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => void handleSkipWelcome()} disabled={savingBranding}>
              Skip for now
            </Button>
            <Button onClick={handleSaveWelcomeBranding} disabled={savingBranding}>
              {savingBranding ? "Saving..." : "Save and continue"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={unsavedSettingsDialogOpen}
        onOpenChange={(open) => {
          setUnsavedSettingsDialogOpen(open);
          if (!open) setPendingUnsavedModal(null);
        }}
      >
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Unsaved settings changes</DialogTitle>
            <DialogDescription>
              You have unsaved changes. Do you want to discard these changes and close?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setUnsavedSettingsDialogOpen(false);
                setPendingUnsavedModal(null);
              }}
            >
              Continue editing
            </Button>
            <Button
              onClick={async () => {
                setUnsavedSettingsDialogOpen(false);
                const targetModal = pendingUnsavedModal;
                setPendingUnsavedModal(null);

                if (targetModal === "branding") {
                  await handleSaveBranding();
                  return;
                }

                if (targetModal === "welcome") {
                  await handleSaveWelcomeBranding();
                }
              }}
              disabled={savingBranding}
            >
              {savingBranding ? "Saving..." : "Save and close"}
            </Button>
            <Button variant="destructive" onClick={discardUnsavedSettingsChanges}>
              Discard changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={customUnitsValidationOpen} onOpenChange={setCustomUnitsValidationOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Custom unit numbers are incomplete</DialogTitle>
            <DialogDescription>
              There {customUnitsValidationMissing === 1 ? "is" : "are"} {customUnitsValidationMissing} empty custom unit
              {customUnitsValidationMissing === 1 ? "" : "s"}. Fill all unit numbers before saving, or change unit settings
              back to Auto / disable multiple units.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setCustomUnitsValidationOpen(false)}>OK</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function ProjectFormFields({
  form,
  onChange,
}: {
  form: ProjectForm;
  onChange: (form: ProjectForm) => void;
}) {
  return (
    <div className="space-y-4 py-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm mb-1.5 block">
            Project Number <span className="text-destructive">*</span>
          </Label>
          <Input
            value={form.projectNumber}
            onChange={(e) => onChange({ ...form, projectNumber: e.target.value })}
            placeholder="e.g. 2024-001"
            className="bg-input/50"
          />
        </div>
        <div>
          <Label className="text-sm mb-1.5 block">
            Project Name <span className="text-destructive">*</span>
          </Label>
          <Input
            value={form.projectName}
            onChange={(e) => onChange({ ...form, projectName: e.target.value })}
            placeholder="e.g. Shell Moerdijk"
            className="bg-input/50"
          />
        </div>
      </div>
      <div>
        <Label className="text-sm mb-1.5 block">
          Customer Name <span className="text-destructive">*</span>
        </Label>
        <Input
          value={form.customerName}
          onChange={(e) => onChange({ ...form, customerName: e.target.value })}
          placeholder="e.g. Shell Nederland B.V."
          className="bg-input/50"
        />
      </div>
      <div>
        <Label className="text-sm mb-1.5 block">
          Customer Project Number{" "}
          <span className="text-muted-foreground text-xs">(optional)</span>
        </Label>
        <Input
          value={form.customerProjectNumber}
          onChange={(e) => onChange({ ...form, customerProjectNumber: e.target.value })}
          placeholder="e.g. CPN-2024-0042"
          className="bg-input/50"
        />
      </div>
    </div>
  );
}


