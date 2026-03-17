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
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Edit2,
  Loader2,
  PlusCircle,
  Trash2,
  UtensilsCrossed,
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

const emptyForm = {
  name: "",
  description: "",
  price: "",
  category: "cibo",
  available: true,
};

type FormState = typeof emptyForm;

export default function MenuPage() {
  const { data: items = [], isLoading } = useAllMenuItems();
  const createItem = useCreateMenuItem();
  const updateItem = useUpdateMenuItem();
  const deleteItem = useDeleteMenuItem();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<MenuItem | null>(null);

  const openAdd = () => {
    setEditingItem(null);
    setForm(emptyForm);
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
                <Badge
                  variant="outline"
                  className={
                    item.category === "cibo"
                      ? "text-amber-700 border-amber-300 bg-amber-50 dark:bg-amber-950/30"
                      : "text-sky-700 border-sky-300 bg-sky-50 dark:bg-sky-950/30"
                  }
                >
                  {item.category === "cibo" ? "Cibo" : "Bibita"}
                </Badge>
              </div>
              <p className="text-xl font-display font-bold text-primary">
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
        <Button onClick={openAdd} data-ocid="menu.primary_button">
          <PlusCircle className="w-4 h-4 mr-2" /> Aggiungi voce
        </Button>
      </div>

      <Tabs defaultValue="tutti">
        <TabsList className="mb-6" data-ocid="menu.tab">
          <TabsTrigger value="tutti" data-ocid="menu.tutti.tab">
            Tutti ({items.length})
          </TabsTrigger>
          <TabsTrigger value="cibi" data-ocid="menu.cibi.tab">
            Cibi ({items.filter((i) => i.category === "cibo").length})
          </TabsTrigger>
          <TabsTrigger value="bibite" data-ocid="menu.bibite.tab">
            Bibite ({items.filter((i) => i.category === "bibita").length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tutti">{renderItems(items)}</TabsContent>
        <TabsContent value="cibi">
          {renderItems(items.filter((i) => i.category === "cibo"))}
        </TabsContent>
        <TabsContent value="bibite">
          {renderItems(items.filter((i) => i.category === "bibita"))}
        </TabsContent>
      </Tabs>

      {/* Add / Edit Dialog */}
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
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cibo">Cibo</SelectItem>
                    <SelectItem value="bibita">Bibita</SelectItem>
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

      {/* Delete Confirm */}
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
