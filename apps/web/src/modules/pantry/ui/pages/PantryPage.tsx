import { useState } from "react";
import { PantryItemList } from "../components/PantryItemList";
import { AddItemModal } from "../components/AddItemModal";
import { ImageUploadParser } from "../components/ImageUploadParser";
import { usePantry } from "../../application/usePantry";
import "../../styles/pantry.css";

interface Props {
  token: string;
  onBack: () => void;
  onGenerateRecipes: () => void;
  onMutated?: () => void;
  embedded?: boolean;
}

type Modal = "none" | "add" | "upload";

export function PantryPage({ token, onBack, onGenerateRecipes, onMutated, embedded = false }: Props) {
  const { items, meta, loading, error, expiredCount, expiringSoonCount, load, add, remove } = usePantry(token);
  const [modal, setModal] = useState<Modal>("none");

  const handleLoad = async () => {
    await load();
    onMutated?.();
  };

  const handleAdd = async (data: { rawName: string; quantity: number; unit: string; expiryDate?: string; notes?: string }) => {
    await add(data);
    onMutated?.();
  };

  const handleRemove = async (itemId: string) => {
    await remove(itemId);
    onMutated?.();
  };

  const content = (
    <>
        <header className="ig-toolbar">
          <div className="ig-toolbar-left">
            <div>
              <p><i>Hello, </i></p>
              <h1 className="ig-toolbar-title">My Pantry</h1>
              {meta ? (
                <p className="ig-toolbar-subtitle">
                  {meta.itemCount} item{meta.itemCount !== 1 ? "s" : ""}
                  {meta.expiringCount > 0 ? ` - ${meta.expiringCount} expiring soon` : ""}
                </p>
              ) : null}
            </div>
          </div>

          <div className="ig-toolbar-actions">
            {/* <button className="btn-primary" onClick={onGenerateRecipes} title="Generate recipes from pantry">Recipes</button> */}
            <button className="btn-primary" onClick={() => setModal("upload")} title="Upload image">Upload</button>
            <button className="btn-primary" onClick={() => setModal("add")} title="Add item">+ Add</button>
          </div>
        </header>

        {(expiredCount > 0 || expiringSoonCount > 0) ? (
          <div className={`ig-alert ${expiredCount > 0 ? "is-danger" : "is-warning"}`}>
            {expiredCount > 0 ? `${expiredCount} item${expiredCount !== 1 ? "s have" : " has"} expired.` : ""}
            {expiringSoonCount > 0 ? ` ${expiringSoonCount} item${expiringSoonCount !== 1 ? "s are" : " is"} expiring soon.` : ""}
          </div>
        ) : null}

        <section className="ig-card ig-pantry-content">
          {loading ? <div className="ig-page-note">Loading pantry...</div> : null}
          {!loading && error ? <div className="ig-error-note">{error}</div> : null}
          {!loading && !error ? <PantryItemList items={items} onDelete={handleRemove} /> : null}
        </section>

        {modal === "add" ? (
          <AddItemModal onAdd={handleAdd} onClose={() => setModal("none")} />
        ) : null}

        {modal === "upload" ? (
          <ImageUploadParser token={token} onComplete={handleLoad} onClose={() => setModal("none")} />
        ) : null}
    </>
  );

  if (embedded) {
    return <section className="ig-pantry-embedded">{content}</section>;
  }

  return (
    <main className="ig-screen">
      <section className="ig-page-shell ig-pantry-shell">
        {content}
      </section>
    </main>
  );
}
