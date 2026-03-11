/**
 * Projects Page — Main hub after login
 * Lists all projects, allows CRUD on projects and their products.
 * Clicking a product opens the MDB Builder.
 */
import { useAuth } from "@/contexts/AuthContext";
import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";

const LOGO_PNG =
  "https://d2xsxph8kpxj0f.cloudfront.net/109618846/j2CceLNvy3BzdkKcwBZVT6/BizzBit%20Logo%20large_88d9f1c2.png";

// ─── Form state helpers ──────────────────────────────────────────────────────

interface ProjectForm {
  projectNumber: string;
  projectName: string;
  customerName: string;
  customerProjectNumber: string;
}

interface ProductForm {
  productName: string;
  tagNumber: string;
  mdbDocumentNumber: string;
  supplierName: string;
  supplierProjectNumber: string;
}

const emptyProjectForm = (): ProjectForm => ({
  projectNumber: "",
  projectName: "",
  customerName: "",
  customerProjectNumber: "",
});

const emptyProductForm = (): ProductForm => ({
  productName: "",
  tagNumber: "",
  mdbDocumentNumber: "",
  supplierName: "",
  supplierProjectNumber: "",
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
  const [savingProject, setSavingProject] = useState(false);

  // ── Products modal (open when clicking a project)
  const [productsOpen, setProductsOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // ── Product dialogs
  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [editProductOpen, setEditProductOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProductForm());
  const [savingProduct, setSavingProduct] = useState(false);

  // Auth guard
  if (authLoading) return null;
  if (!user) {
    navigate("/");
    return null;
  }

  // ── Load projects on mount
  useEffect(() => {
    loadProjectsList();
  }, []);

  async function loadProjectsList() {
    setLoadingProjects(true);
    const { projects: p, error } = await listProjects();
    if (error) toast.error("Failed to load projects", { description: error });
    else setProjects(p);
    setLoadingProjects(false);
  }

  // ── Open products modal
  const handleOpenProject = useCallback(async (project: Project) => {
    setSelectedProject(project);
    setProducts([]);
    setProductsOpen(true);
    setLoadingProducts(true);
    const { products: p, error } = await listProducts(project.id);
    if (error) toast.error("Failed to load products", { description: error });
    else setProducts(p);
    setLoadingProducts(false);
  }, []);

  // ── Project create/edit ──────────────────────────────────────────────────

  function openCreateProject() {
    setProjectForm(emptyProjectForm());
    setCreateProjectOpen(true);
  }

  function openEditProject(project: Project) {
    setEditingProject(project);
    setProjectForm({
      projectNumber: project.projectNumber,
      projectName: project.projectName,
      customerName: project.customerName,
      customerProjectNumber: project.customerProjectNumber ?? "",
    });
    setEditProjectOpen(true);
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
    setProductForm(emptyProductForm());
    setCreateProductOpen(true);
  }

  function openEditProduct(product: Product) {
    setEditingProduct(product);
    setProductForm({
      productName: product.productName,
      tagNumber: product.tagNumber,
      mdbDocumentNumber: product.mdbDocumentNumber,
      supplierName: product.supplierName ?? "",
      supplierProjectNumber: product.supplierProjectNumber ?? "",
    });
    setEditProductOpen(true);
  }

  async function handleCreateProduct() {
    if (!selectedProject) return;
    if (!productForm.productName.trim() || !productForm.tagNumber.trim() || !productForm.mdbDocumentNumber.trim()) {
      toast.error("Product name, tag number, and MDB document number are required");
      return;
    }
    setSavingProduct(true);
    const { product, error } = await createProduct({
      projectId: selectedProject.id,
      productName: productForm.productName.trim(),
      tagNumber: productForm.tagNumber.trim(),
      mdbDocumentNumber: productForm.mdbDocumentNumber.trim(),
      supplierName: productForm.supplierName.trim() || undefined,
      supplierProjectNumber: productForm.supplierProjectNumber.trim() || undefined,
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
    toast.success(`Product "${product.productName}" created`);
  }

  async function handleUpdateProduct() {
    if (!editingProduct) return;
    if (!productForm.productName.trim() || !productForm.tagNumber.trim() || !productForm.mdbDocumentNumber.trim()) {
      toast.error("Product name, tag number, and MDB document number are required");
      return;
    }
    setSavingProduct(true);
    const { product, error } = await updateProduct(editingProduct.id, {
      productName: productForm.productName.trim(),
      tagNumber: productForm.tagNumber.trim(),
      mdbDocumentNumber: productForm.mdbDocumentNumber.trim(),
      supplierName: productForm.supplierName.trim() || null,
      supplierProjectNumber: productForm.supplierProjectNumber.trim() || null,
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

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      {/* Nav */}
      <nav className="border-b border-border/50 bg-card/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={LOGO_PNG} alt="BizzBit" className="h-6" />
            <span className="text-muted-foreground text-sm font-[var(--font-mono)] tracking-wide">
              MDB Builder
            </span>
          </div>
          <div className="flex items-center gap-2">
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
          <Button onClick={openCreateProject} className="gap-2">
            <Plus className="h-4 w-4" />
            New Project
          </Button>
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
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
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
        )}
      </div>

      {/* ── Create Project Dialog ─────────────────────────────────────────── */}
      <Dialog open={createProjectOpen} onOpenChange={setCreateProjectOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>New Project</DialogTitle>
            <DialogDescription>
              Create a new project to group your MDB products under.
            </DialogDescription>
          </DialogHeader>
          <ProjectFormFields form={projectForm} onChange={setProjectForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateProjectOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProject} disabled={savingProject}>
              {savingProject ? "Creating…" : "Create Project"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Project Dialog ───────────────────────────────────────────── */}
      <Dialog open={editProjectOpen} onOpenChange={setEditProjectOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          <ProjectFormFields form={projectForm} onChange={setProjectForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProjectOpen(false)}>
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
                        <span className="font-[var(--font-mono)]">Tag: {product.tagNumber}</span>
                        <span className="font-[var(--font-mono)]">Doc: {product.mdbDocumentNumber}</span>
                        {product.supplierName && <span>{product.supplierName}</span>}
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
      <Dialog open={createProductOpen} onOpenChange={setCreateProductOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Add Product</DialogTitle>
            <DialogDescription>
              A product represents a single equipment item or tag that will have its own MDB.
            </DialogDescription>
          </DialogHeader>
          <ProductFormFields form={productForm} onChange={setProductForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateProductOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateProduct} disabled={savingProduct}>
              {savingProduct ? "Creating…" : "Add Product"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Edit Product Dialog ───────────────────────────────────────────── */}
      <Dialog open={editProductOpen} onOpenChange={setEditProductOpen}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
          </DialogHeader>
          <ProductFormFields form={productForm} onChange={setProductForm} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditProductOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateProduct} disabled={savingProduct}>
              {savingProduct ? "Saving…" : "Save Changes"}
            </Button>
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

function ProductFormFields({
  form,
  onChange,
}: {
  form: ProductForm;
  onChange: (form: ProductForm) => void;
}) {
  return (
    <div className="space-y-4 py-1">
      <div>
        <Label className="text-sm mb-1.5 block">
          Product Name <span className="text-destructive">*</span>
        </Label>
        <Input
          value={form.productName}
          onChange={(e) => onChange({ ...form, productName: e.target.value })}
          placeholder="e.g. Pressure Vessel V-4501"
          className="bg-input/50"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm mb-1.5 block">
            Tag Number <span className="text-destructive">*</span>
          </Label>
          <Input
            value={form.tagNumber}
            onChange={(e) => onChange({ ...form, tagNumber: e.target.value })}
            placeholder="e.g. V-4501"
            className="bg-input/50 font-[var(--font-mono)]"
          />
        </div>
        <div>
          <Label className="text-sm mb-1.5 block">
            MDB Document Number <span className="text-destructive">*</span>
          </Label>
          <Input
            value={form.mdbDocumentNumber}
            onChange={(e) => onChange({ ...form, mdbDocumentNumber: e.target.value })}
            placeholder="e.g. MDB-2024-001"
            className="bg-input/50 font-[var(--font-mono)]"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label className="text-sm mb-1.5 block">
            Supplier Name{" "}
            <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            value={form.supplierName}
            onChange={(e) => onChange({ ...form, supplierName: e.target.value })}
            placeholder="e.g. ACME Fabrication"
            className="bg-input/50"
          />
        </div>
        <div>
          <Label className="text-sm mb-1.5 block">
            Supplier Project No.{" "}
            <span className="text-muted-foreground text-xs">(optional)</span>
          </Label>
          <Input
            value={form.supplierProjectNumber}
            onChange={(e) => onChange({ ...form, supplierProjectNumber: e.target.value })}
            placeholder="e.g. SP-2024-77"
            className="bg-input/50 font-[var(--font-mono)]"
          />
        </div>
      </div>
    </div>
  );
}
