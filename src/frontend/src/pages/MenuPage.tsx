import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit2,
  Layers,
  Loader2,
  PlusCircle,
  Trash2,
  UtensilsCrossed,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import type { MenuItem } from "../backend.d";
import {
  useAllMenuItems,
  useCreateMenuItem,
  useDeleteMenuItem,
  useUpdateMenuItem,
} from "../hooks/useQueries";

const SECTIONS_KEY = "menu_sections";
const DEFAULT_SECTIONS = ["Cibo", "Bibite"];

function loadSections(): string[] {
  try {
    const raw = localStorage.getItem(SECTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    // ignore
  }
  return DEFAULT_SECTIONS;
}

function saveSections(sections: string[]) {
  localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections));
}

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "",
  available: true,
};

type FormState = typeof emptyForm;

export default function MenuPage() {
  const { data: items = [], isLoading } = useAllMenuItems();
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();

  const [sections, setSections] = useState<string[]>(loadSections);

  // Item dialog
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);

  // Sections management dialog
  const [sectionsDialogOpen, setSectionsDialogOpen] = useState(false);
  const [newSectionName, setNewSectionName] = useState("");
  const [renamingIdx, setRenamingIdx] = useState<number | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteSectionTarget, setDeleteSectionTarget] = useState<string | null>(
    null,
  );

  const updateSections = (next: string[]) => {
    setSections(next);
    saveSections(next);
  };

  const openAdd = () => {
    setEditingItem(null);
    setForm({ ...emptyForm, category: sections[0] ?? "" });
    setDialogOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setForm({
      name: item.name,
      description: item.description,
      price: item.price.toString(),
      category: item.category,
      available: item.available,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const price = Number.parseFloat(form.price);
    if (!form.name.trim() || Number.isNaN(price)) {
      toast.error("Compila tutti i campi obbligatori");
      return;
    }
    if (editingItem) {
      await updateItem.mutateAsync({
        id: editingItem.id,
        name: form.name,
        description: form.description,
        price,
        category: form.category,
        available: form.available,
      });
      toast.success("Voce aggiornata");
    } else {
      await createItem.mutateAsync({
        name: form.name,
        description: form.description,
        price,
        category: form.category,
        available: form.available,
      });
      toast.success("Voce aggiunta al menu");
    }
    setDialogOpen(false);
  };

  const handleToggleAvailable = async (item: MenuItem) => {
    await updateItem.mutateAsync({
      id: item.id,
      name: item.name,
      description: item.description,
      price: item.price,
      category: item.category,
      available: !item.available,
    });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await deleteItem.mutateAsync(deleteTarget.id);
    toast.success("Voce eliminata");
    setDeleteTarget(null);
  };

  // Section management handlers
  const handleAddSection = () => {
    const trimmed = newSectionName.trim();
    if (!trimmed) return;
    if (sections.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      toast.error("Sezione già esistente");
      return;
    }
    updateSections([...sections, trimmed]);
    setNewSectionName("");
    toast.success(`Sezione "${trimmed}" aggiunta`);
  };

  const handleRenameSection = (idx: number) => {
    const trimmed = renameValue.trim();
    if (!trimmed) return;
    if (
      sections.some(
        (s, i) => i !== idx && s.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      toast.error("Esiste già una sezione con questo nome");
      return;
    }
    const next = sections.map((s, i) => (i === idx ? trimmed : s));
    updateSections(next);
    setRenamingIdx(null);
    setRenameValue("");
    toast.success("Sezione rinominata");
  };

  const confirmDeleteSection = (sectionName: string) => {
    setDeleteSectionTarget(sectionName);
  };

  const handleDeleteSection = () => {
    if (!deleteSectionTarget) return;
    const next = sections.filter((s) => s !== deleteSectionTarget);
    updateSections(next);
    setDeleteSectionTarget(null);
    toast.success(`Sezione "${deleteSectionTarget}" eliminata`);
  };

  const itemsInSection = (sectionName: string) =>
    items.filter((i) => i.category.toLowerCase() === sectionName.toLowerCase());

  const isPending = createItem.isPending || updateItem.isPending;

  const renderItems = (filtered: MenuItem[]) => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <Skeleton
              key={i}
              className="h-44 rounded-xl"
              data-ocid="menu.loading_state"
            />
          ))}
        </div>
      );
    }
    if (filtered.length === 0) {
      return (
        <div
          data-ocid="menu.empty_state"
          className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-4"
        >
          <UtensilsCrossed className="w-12 h-12 opacity-30" />
          <p className="text-sm">Nessuna voce in questa categoria.</p>
          <Button
            variant="outline"
            size="sm"
            onClick={openAdd}
            data-ocid="menu.empty.primary_button"
          >
            <PlusCircle className="w-4 h-4 mr-2" /> Aggiungi voce
          </Button>
        </div>
      );
    }
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((item, idx) => (
          <Card
            key={item.id.toString()}
            data-ocid={`menu.item.${idx + 1}`}
            className="flex flex-col border border-border/60 hover:border-border transition-colors"
          >
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <CardTitle className="text-base font-semibold leading-tight">
                  {item.name}
                </CardTitle>
                <Badge variant="outline" className="shrink-0">
                  {item.category}
                </Badge>
              </div>
              <p className="text-xl font-bold text-primary">
                €{item.price.toFixed(2)}
              </p>
            </CardHeader>
            <CardContent className="flex-1">
              {item.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {item.description}
                </p>
              )}
            </CardContent>
            <CardFooter className="flex items-center justify-between pt-3 border-t border-border/40">
              <div className="flex items-center gap-2">
                <Switch
                  checked={item.available}
                  onCheckedChange={() => handleToggleAvailable(item)}
                  data-ocid={`menu.item.switch.${idx + 1}`}
                />
                <span className="text-xs text-muted-foreground">
                  {item.available ? "Disponibile" : "Non disponibile"}
                </span>
              </div>
              <div className="flex gap-1">
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8"
                  onClick={() => openEdit(item)}
                  data-ocid={`menu.item.edit_button.${idx + 1}`}
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-destructive hover:text-destructive"
                  onClick={() => setDeleteTarget(item)}
                  data-ocid={`menu.item.delete_button.${idx + 1}`}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  };

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Menu
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Gestisci cibi e bibite del tuo ristorante
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setSectionsDialogOpen(true)}
            data-ocid="menu.sections.open_modal_button"
          >
            <Layers className="w-4 h-4 mr-2" /> Gestisci sezioni
          </Button>
          <Button onClick={openAdd} data-ocid="menu.primary_button">
            <PlusCircle className="w-4 h-4 mr-2" /> Aggiungi voce
          </Button>
        </div>
      </div>

      <Tabs defaultValue="tutti">
        <TabsList className="mb-6 flex-wrap h-auto gap-1" data-ocid="menu.tab">
          <TabsTrigger value="tutti" data-ocid="menu.tutti.tab">
            Tutti ({items.length})
          </TabsTrigger>
          {sections.map((section) => (
            <TabsTrigger
              key={section}
              value={section}
              data-ocid={"menu.section.tab"}
            >
              {section} ({itemsInSection(section).length})
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="tutti">{renderItems(items)}</TabsContent>
        {sections.map((section) => (
          <TabsContent key={section} value={section}>
            {renderItems(itemsInSection(section))}
          </TabsContent>
        ))}
      </Tabs>

      {/* Sections Management Dialog */}
      <Dialog open={sectionsDialogOpen} onOpenChange={setSectionsDialogOpen}>
        <DialogContent className="sm:max-w-md" data-ocid="menu.sections.dialog">
          <DialogHeader>
            <DialogTitle>Gestisci sezioni</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Existing sections */}
            <div className="space-y-2">
              {sections.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Nessuna sezione. Aggiungine una sotto.
                </p>
              )}
              {sections.map((section, idx) => {
                const count = itemsInSection(section).length;
                return (
                  <div
                    key={section}
                    className="flex items-center gap-2 p-2 rounded-lg border border-border/60 bg-muted/30"
                    data-ocid={`menu.sections.item.${idx + 1}`}
                  >
                    {renamingIdx === idx ? (
                      <Input
                        className="flex-1 h-7 text-sm"
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRenameSection(idx);
                          if (e.key === "Escape") {
                            setRenamingIdx(null);
                            setRenameValue("");
                          }
                        }}
                        autoFocus
                        data-ocid="menu.sections.input"
                      />
                    ) : (
                      <span className="flex-1 text-sm font-medium">
                        {section}
                        <span className="ml-2 text-xs text-muted-foreground">
                          ({count} {count === 1 ? "voce" : "voci"})
                        </span>
                      </span>
                    )}

                    {renamingIdx === idx ? (
                      <>
                        <Button
                          size="sm"
                          variant="default"
                          className="h-7 px-2 text-xs"
                          onClick={() => handleRenameSection(idx)}
                          data-ocid="menu.sections.save_button"
                        >
                          Salva
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            setRenamingIdx(null);
                            setRenameValue("");
                          }}
                          data-ocid="menu.sections.cancel_button"
                        >
                          <X className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => {
                            setRenamingIdx(idx);
                            setRenameValue(section);
                          }}
                          data-ocid={`menu.sections.edit_button.${idx + 1}`}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() => confirmDeleteSection(section)}
                          data-ocid={`menu.sections.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            <Separator />

            {/* Add new section */}
            <div className="space-y-1.5">
              <Label>Aggiungi nuova sezione</Label>
              <div className="flex gap-2">
                <Input
                  value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddSection()}
                  placeholder="Es. Dessert, Vini, Antipasti…"
                  data-ocid="menu.sections.new.input"
                />
                <Button
                  onClick={handleAddSection}
                  disabled={!newSectionName.trim()}
                  data-ocid="menu.sections.add_button"
                >
                  <PlusCircle className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSectionsDialogOpen(false)}
              data-ocid="menu.sections.close_button"
            >
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete section confirm */}
      <AlertDialog
        open={!!deleteSectionTarget}
        onOpenChange={(o) => !o && setDeleteSectionTarget(null)}
      >
        <AlertDialogContent data-ocid="menu.sections.modal">
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina sezione</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare la sezione{" "}
              <strong>{deleteSectionTarget}</strong>?
              {deleteSectionTarget &&
                itemsInSection(deleteSectionTarget).length > 0 && (
                  <span className="block mt-2 text-amber-600 dark:text-amber-400">
                    ⚠️ Attenzione: {itemsInSection(deleteSectionTarget).length}{" "}
                    {itemsInSection(deleteSectionTarget).length === 1
                      ? "voce usa"
                      : "voci usano"}{" "}
                    questa sezione. Le voci non verranno eliminate ma la loro
                    categoria resterà invariata.
                  </span>
                )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="menu.sections.cancel_button">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSection}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="menu.sections.confirm_button"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add / Edit Item Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md" data-ocid="menu.dialog">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Modifica voce" : "Aggiungi voce al menu"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label htmlFor="menu-name">Nome *</Label>
              <Input
                id="menu-name"
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="Es. Tagliatelle al ragù"
                data-ocid="menu.input"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="menu-desc">Descrizione</Label>
              <Textarea
                id="menu-desc"
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Breve descrizione della voce..."
                rows={3}
                data-ocid="menu.textarea"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="menu-price">Prezzo (€) *</Label>
                <Input
                  id="menu-price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, price: e.target.value }))
                  }
                  placeholder="0.00"
                  data-ocid="menu.price.input"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Categoria *</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((p) => ({ ...p, category: v }))}
                >
                  <SelectTrigger data-ocid="menu.select">
                    <SelectValue placeholder="Seleziona sezione" />
                  </SelectTrigger>
                  <SelectContent>
                    {sections.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                    {sections.length === 0 && (
                      <SelectItem value="" disabled>
                        Nessuna sezione
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="menu-available"
                checked={form.available}
                onCheckedChange={(v) =>
                  setForm((p) => ({ ...p, available: !!v }))
                }
                data-ocid="menu.checkbox"
              />
              <Label htmlFor="menu-available" className="cursor-pointer">
                Disponibile
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDialogOpen(false)}
              data-ocid="menu.cancel_button"
            >
              Annulla
            </Button>
            <Button
              onClick={handleSave}
              disabled={isPending}
              data-ocid="menu.save_button"
            >
              {isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              {editingItem ? "Salva modifiche" : "Aggiungi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Item Confirm */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="menu.modal">
          <AlertDialogHeader>
            <AlertDialogTitle>Elimina voce</AlertDialogTitle>
            <AlertDialogDescription>
              Sei sicuro di voler eliminare{" "}
              <strong>{deleteTarget?.name}</strong>? Questa azione è
              irreversibile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="menu.cancel_button">
              Annulla
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              data-ocid="menu.confirm_button"
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
