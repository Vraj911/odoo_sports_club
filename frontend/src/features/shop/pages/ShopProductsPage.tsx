import { useState, useMemo } from "react";
import { POSTopBar } from "../components/POSTopBar";
import { SAMPLE_PRODUCTS } from "../sampleData";
import type { Product, ProductCategory, ProductVariant } from "../types";
import { CATEGORY_LABELS } from "../types";
import { Money } from "@/components/shared/Money";
import { Drawer } from "@/components/ui/Drawer";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  Tags,
  Search,
  Plus,
  Edit2,
  Trash2,
  Image as ImageIcon,
  CheckCircle2,
  Sparkles,
  Layers,
  ArrowUpDown,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/cn";

export default function ShopProductsPage() {
  const [products, setProducts] = useState<Product[]>(SAMPLE_PRODUCTS);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | "all">("all");

  // Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<ProductCategory>("rackets");
  const [description, setDescription] = useState("");
  const [basePrice, setBasePrice] = useState("1000");
  const [mrp, setMrp] = useState("1200");
  const [hsn, setHsn] = useState("9506");
  const [gstRate, setGstRate] = useState("18");
  const [isActive, setIsActive] = useState(true);
  const [variantsList, setVariantsList] = useState<ProductVariant[]>([]);

  const filteredProducts = useMemo(() => {
    let list = [...products];
    if (selectedCategory !== "all") {
      list = list.filter((p) => p.category === selectedCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.brand.toLowerCase().includes(q) ||
          p.variants.some((v) => v.sku.toLowerCase().includes(q))
      );
    }
    return list;
  }, [products, selectedCategory, searchQuery]);

  const handleOpenNew = () => {
    setEditingProduct(null);
    setName("");
    setBrand("");
    setCategory("rackets");
    setDescription("");
    setBasePrice("1000");
    setMrp("1200");
    setHsn("9506");
    setGstRate("18");
    setIsActive(true);
    setVariantsList([
      {
        id: `V-NEW-1`,
        sku: "PROD-STD",
        axes: { Spec: "Standard" },
        stock: 10,
        price: 1000,
      },
    ]);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setBrand(p.brand);
    setCategory(p.category);
    setDescription(p.description);
    setBasePrice(p.basePrice.toString());
    setMrp(p.mrp.toString());
    setHsn("9506");
    setGstRate("18");
    setIsActive(true);
    setVariantsList([...p.variants]);
    setIsDrawerOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Product name is required.");
      return;
    }

    const priceNum = parseFloat(basePrice) || 1000;
    const mrpNum = parseFloat(mrp) || priceNum;

    if (editingProduct) {
      setProducts((prev) =>
        prev.map((p) =>
          p.id === editingProduct.id
            ? {
                ...p,
                name,
                brand,
                category,
                description,
                basePrice: priceNum,
                mrp: mrpNum,
                variants: variantsList,
              }
            : p
        )
      );
      toast.success(`Product "${name}" updated successfully.`);
    } else {
      const newProd: Product = {
        id: `PRD-${Date.now()}`,
        slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        name,
        brand,
        category,
        sport: "tennis",
        description,
        features: ["Standard specification", "Pro club approved"],
        basePrice: priceNum,
        mrp: mrpNum,
        variantAxes: [{ label: "Spec", options: ["Standard"] }],
        variants: variantsList,
        images: [
          "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' fill='%231c2d4d'%3E%3Crect width='400' height='400'/%3E%3Ctext x='50%25' y='50%25' text-anchor='middle' dy='.35em' fill='%23d5f63a' font-family='sans-serif' font-size='48'%3E🏸%3C/text%3E%3C/svg%3E",
        ],
        rating: 5,
        reviewCount: 1,
        tags: ["new"],
      };
      setProducts((prev) => [newProd, ...prev]);
      toast.success(`Product "${name}" created with ${variantsList.length} variant(s).`);
    }

    setIsDrawerOpen(false);
  };

  const handleAddVariantLine = () => {
    const num = variantsList.length + 1;
    setVariantsList((prev) => [
      ...prev,
      {
        id: `V-NEW-${Date.now()}`,
        sku: `${brand ? brand.slice(0, 3).toUpperCase() : "CC"}-VAR-${num}`,
        axes: { Option: `Variant ${num}` },
        stock: 5,
        price: parseFloat(basePrice) || 1000,
      },
    ]);
  };

  const handleUpdateVariant = (
    index: number,
    field: "sku" | "price" | "stock" | "option",
    value: string
  ) => {
    setVariantsList((prev) =>
      prev.map((v, i) => {
        if (i !== index) return v;
        if (field === "sku") return { ...v, sku: value };
        if (field === "price") return { ...v, price: parseFloat(value) || 0 };
        if (field === "stock") return { ...v, stock: parseInt(value) || 0 };
        if (field === "option") return { ...v, axes: { Spec: value } };
        return v;
      })
    );
  };

  const handleDeleteVariant = (index: number) => {
    if (variantsList.length <= 1) {
      toast.error("Product must have at least one variant.");
      return;
    }
    setVariantsList((prev) => prev.filter((_, i) => i !== index));
  };

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-backdrop text-chalk font-sans">
      <POSTopBar activeModule="products" />

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto w-full flex flex-col min-h-0">
        {/* Header */}
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-chalk/12 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Tags className="size-6 text-volt-400" />
              <h2 className="text-xl sm:text-2xl font-black text-chalk tracking-tight">
                Product Catalog & Variants
              </h2>
            </div>
            <p className="mt-1 text-xs text-chalk/60">
              Manage product master records, SKU pricing overrides, and variant matrices.
            </p>
          </div>

          <Button variant="primary" onClick={handleOpenNew} className="font-bold">
            <Plus className="size-4 mr-1.5" />
            <span>Add Product</span>
          </Button>
        </div>

        {/* Filter bar */}
        <div className="mb-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-chalk/50" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search product name, brand, or SKU..."
              className="h-10 w-full rounded-pill border border-chalk/16 bg-white/8 pl-10 pr-4 text-xs text-chalk placeholder:text-chalk/45 focus:border-volt-400 focus:outline-none"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory("all")}
              className={cn(
                "rounded-pill px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
                selectedCategory === "all"
                  ? "bg-chalk text-ink-900 shadow-sm"
                  : "bg-chalk/8 text-chalk/70 hover:bg-chalk/14"
              )}
            >
              All
            </button>
            {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  "rounded-pill px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
                  selectedCategory === cat
                    ? "bg-volt-400 text-ink-900 font-bold"
                    : "bg-chalk/8 text-chalk/70 hover:bg-chalk/14"
                )}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Products Table */}
        <div className="flex-1 overflow-y-auto rounded-[20px] border border-chalk/14 bg-court-600/70 p-4 backdrop-blur-md">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-chalk/12 text-chalk/50 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="pb-3 font-semibold">Product Name</th>
                <th className="pb-3 font-semibold">Brand</th>
                <th className="pb-3 font-semibold">Category</th>
                <th className="pb-3 font-semibold text-center">Variants</th>
                <th className="pb-3 font-semibold">Base Price</th>
                <th className="pb-3 font-semibold">MRP</th>
                <th className="pb-3 font-semibold text-center">Status</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-chalk/8">
              {filteredProducts.map((p) => (
                <tr key={p.id} className="hover:bg-chalk/6 transition-colors">
                  <td className="py-3 pr-2">
                    <p className="font-semibold text-chalk text-sm">{p.name}</p>
                    <p className="text-[11px] text-chalk/50 line-clamp-1">{p.description}</p>
                  </td>

                  <td className="py-3 font-medium text-chalk/80">{p.brand}</td>

                  <td className="py-3">
                    <span className="rounded-pill bg-chalk/8 px-2 py-0.5 text-[11px] font-semibold text-chalk/80">
                      {CATEGORY_LABELS[p.category]}
                    </span>
                  </td>

                  <td className="py-3 text-center">
                    <span className="rounded-pill bg-volt-400/20 border border-volt-400/40 px-2 py-0.5 text-[11px] font-bold text-volt-300">
                      {p.variants.length} var{p.variants.length > 1 ? "s" : ""}
                    </span>
                  </td>

                  <td className="py-3 font-bold text-chalk">
                    <Money amount={p.basePrice} />
                  </td>

                  <td className="py-3 text-chalk/50">
                    <Money amount={p.mrp} />
                  </td>

                  <td className="py-3 text-center">
                    <span className="rounded-pill bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                      Active
                    </span>
                  </td>

                  <td className="py-3 text-right">
                    <Button
                      variant="outline"
                      onClick={() => handleOpenEdit(p)}
                      className="h-8 text-xs px-2.5"
                    >
                      <Edit2 className="size-3 mr-1" />
                      <span>Edit</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>

      {/* ─── Product Editor Drawer ─── */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.name}` : "Create New Product"}
        subtitle="Manage master details and variants sub-table"
      >
        <form onSubmit={handleSaveProduct} className="flex flex-col gap-5 text-chalk pb-6">
          <Input
            label="Product Name *"
            placeholder="e.g. Yonex Nanoflare 1000Z"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Brand *"
              placeholder="e.g. Yonex, Wilson"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              required
            />

            <div>
              <label className="text-[11px] font-semibold text-chalk/80 uppercase tracking-wider block mb-1.5">
                Category *
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ProductCategory)}
                className="h-10 w-full rounded-input border border-chalk/18 bg-court-700 px-3 text-xs text-white focus:border-volt-400 focus:outline-none"
              >
                {(Object.keys(CATEGORY_LABELS) as ProductCategory[]).map((cat) => (
                  <option key={cat} value={cat}>
                    {CATEGORY_LABELS[cat]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-[11px] font-semibold text-chalk/80 uppercase tracking-wider block mb-1.5">
              Description
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Features, material details, recommended player level..."
              className="w-full rounded-xl border border-chalk/18 bg-court-700/80 p-3 text-xs text-white placeholder:text-chalk/40 focus:border-volt-400 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Input
              label="Base Price (₹) *"
              type="number"
              value={basePrice}
              onChange={(e) => setBasePrice(e.target.value)}
              required
            />
            <Input
              label="MRP (₹) *"
              type="number"
              value={mrp}
              onChange={(e) => setMrp(e.target.value)}
              required
            />
            <Input
              label="HSN Code"
              value={hsn}
              onChange={(e) => setHsn(e.target.value)}
            />
            <Input
              label="GST Rate (%)"
              value={gstRate}
              onChange={(e) => setGstRate(e.target.value)}
            />
          </div>

          {/* Variants Sub-Table */}
          <div className="pt-2 border-t border-chalk/12">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-chalk/80 uppercase tracking-wider">
                Product Variants ({variantsList.length})
              </h4>
              <button
                type="button"
                onClick={handleAddVariantLine}
                className="flex items-center gap-1 rounded-pill bg-volt-400/20 px-2.5 py-1 text-[11px] font-bold text-volt-300 hover:bg-volt-400/30"
              >
                <Plus className="size-3" />
                <span>Add Variant</span>
              </button>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {variantsList.map((v, idx) => (
                <div
                  key={v.id}
                  className="rounded-xl border border-chalk/10 bg-court-700/60 p-2.5 grid grid-cols-12 gap-2 items-center text-xs"
                >
                  <div className="col-span-3">
                    <label className="text-[9px] text-chalk/50 block">Spec/Option</label>
                    <input
                      type="text"
                      value={Object.values(v.axes)[0] || "Standard"}
                      onChange={(e) => handleUpdateVariant(idx, "option", e.target.value)}
                      className="w-full h-7 rounded border border-chalk/16 bg-chalk/8 px-1.5 text-xs text-white"
                    />
                  </div>

                  <div className="col-span-4">
                    <label className="text-[9px] text-chalk/50 block">SKU</label>
                    <input
                      type="text"
                      value={v.sku}
                      onChange={(e) => handleUpdateVariant(idx, "sku", e.target.value)}
                      className="w-full h-7 rounded border border-chalk/16 bg-chalk/8 px-1.5 font-mono text-[11px] text-white"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[9px] text-chalk/50 block">Price (₹)</label>
                    <input
                      type="number"
                      value={v.price}
                      onChange={(e) => handleUpdateVariant(idx, "price", e.target.value)}
                      className="w-full h-7 rounded border border-chalk/16 bg-chalk/8 px-1.5 text-xs text-volt-300 font-bold"
                    />
                  </div>

                  <div className="col-span-2">
                    <label className="text-[9px] text-chalk/50 block">Stock</label>
                    <input
                      type="number"
                      value={v.stock}
                      onChange={(e) => handleUpdateVariant(idx, "stock", e.target.value)}
                      className="w-full h-7 rounded border border-chalk/16 bg-chalk/8 px-1.5 text-xs text-white text-center font-bold"
                    />
                  </div>

                  <div className="col-span-1 flex justify-center pt-3">
                    <button
                      type="button"
                      onClick={() => handleDeleteVariant(idx)}
                      className="text-chalk/40 hover:text-danger p-1"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Drawer Form Actions */}
          <div className="pt-4 border-t border-chalk/12 flex items-center justify-end gap-3">
            <Button variant="ghost" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" className="font-bold px-6">
              Save Product
            </Button>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
