"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

const featureOptions = ["Pool", "Garage", "Garden", "Balcony", "Sea View", "Parking", "Gym", "Smart Home"];
const propertyTypeOptions = ["House", "Apartment", "Villa", "Condo", "Townhouse", "Commercial"];
const MAX_LISTING_PHOTOS = 4;

const steps = [
  { id: 1, label: "Property Facts", body: "Core listing data" },
  { id: 2, label: "Selling Points", body: "Features and description" },
  { id: 3, label: "Media", body: "Photos for generation" },
];

function formatPriceInput(value) {
  const numeric = String(value || "").replace(/[^\d]/g, "");
  if (!numeric) return "";
  return numeric.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

function Field({ label, children, wide = false }) {
  return (
    <label className={`space-y-2 text-sm font-bold text-[var(--pr-muted)] ${wide ? "md:col-span-2" : ""}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function SnapshotRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-[var(--pr-border-soft)] pb-3">
      <span className="text-sm text-[var(--pr-muted)]">{label}</span>
      <span className="max-w-[180px] truncate text-right text-sm font-bold text-[var(--pr-text)]">{value || "-"}</span>
    </div>
  );
}

export default function NewListingForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    title: "",
    price: "",
    location: "",
    bedrooms: "",
    bathrooms: "",
    sqft: "",
    propertyType: "House",
    description: "",
    features: [],
    photos: [],
  });

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: key === "price" ? formatPriceInput(value) : value }));
  const toggleFeature = (feature) => {
    setForm((prev) => ({
      ...prev,
      features: prev.features.includes(feature) ? prev.features.filter((item) => item !== feature) : [...prev.features, feature],
    }));
  };

  const uploadFiles = async (files) => {
    setUploading(true);
    setError("");
    try {
      const uploaded = [];
      for (const file of Array.from(files).slice(0, MAX_LISTING_PHOTOS - form.photos.length)) {
        const data = new FormData();
        data.append("file", file);
        const response = await fetch("/api/upload", { method: "POST", body: data });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Upload failed");
        uploaded.push(result.url);
      }
      setForm((prev) => ({ ...prev, photos: [...prev.photos, ...uploaded].slice(0, MAX_LISTING_PHOTOS) }));
    } catch (err) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      if (form.photos.length < 1) {
        throw new Error(`Select at least 1 and up to ${MAX_LISTING_PHOTOS} photos before continuing to video generation.`);
      }
      const response = await fetch("/api/listings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photos: form.photos.slice(0, MAX_LISTING_PHOTOS) }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Could not save listing");
      router.push(`/dashboard/listings/${result.listing.id}/generate`);
      router.refresh();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const nextLabel = step === 1 ? "Next: Selling Points" : step === 2 ? "Next: Media" : "Save property";
  const bedsBaths = [form.bedrooms && `${form.bedrooms} bd`, form.bathrooms && `${form.bathrooms} ba`].filter(Boolean).join(" / ");
  const propertyFactsComplete = ["title", "price", "location", "bedrooms", "bathrooms", "sqft", "propertyType"].every((key) =>
    String(form[key] || "").trim(),
  );

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <p className="pr-kicker">Portfolio intake</p>
          <h1 className="mt-1 text-3xl font-black tracking-tight">Create Listing</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--pr-muted)]">
            Enter the core property details, selling points, and photos needed for video generation.
          </p>
        </div>
        <div className="rounded-md border border-[var(--pr-gold)]/30 bg-[var(--pr-gold-soft)] px-3 py-2 text-sm font-bold text-[var(--pr-gold)]">
          Step {step} of {steps.length}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {steps.map((item) => {
          const active = step === item.id;
          const complete = step > item.id;
          return (
            <div
              key={item.id}
              aria-current={active ? "step" : undefined}
              className={`rounded-lg border p-4 text-left ${
                active
                  ? "border-[var(--pr-cyan)] bg-[var(--pr-cyan-soft)]"
                  : complete
                    ? "border-[var(--pr-gold)]/35 bg-[var(--pr-gold-soft)]"
                    : "border-[var(--pr-border-soft)] bg-[#071010]"
              }`}
            >
              <span className={`text-xs font-black ${active ? "text-[var(--pr-cyan)]" : complete ? "text-[var(--pr-gold)]" : "text-[var(--pr-dim)]"}`}>
                0{item.id}
              </span>
              <span className="mt-2 block font-bold text-[var(--pr-text)]">{item.label}</span>
              <span className="mt-1 block text-sm text-[var(--pr-muted)]">{item.body}</span>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section className="pr-section p-5 md:p-6">
          {step === 1 && (
            <div className="space-y-6">
              <div>
                <p className="pr-kicker text-[var(--pr-cyan)]">Property facts</p>
                <h2 className="mt-1 text-xl font-bold">Core listing details</h2>
                <p className="mt-1 text-sm text-[var(--pr-muted)]">These fields feed the listing card, overlays, and property video prompt context.</p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Property title" wide>
                  <input value={form.title} onChange={(event) => setField("title", event.target.value)} className="pr-input px-3 py-3" />
                </Field>
                <Field label="Price">
                  <input value={form.price} onChange={(event) => setField("price", event.target.value)} className="pr-input px-3 py-3" />
                </Field>
                <Field label="Location / city">
                  <input value={form.location} onChange={(event) => setField("location", event.target.value)} className="pr-input px-3 py-3" />
                </Field>
                <Field label="Bedrooms">
                  <input value={form.bedrooms} onChange={(event) => setField("bedrooms", event.target.value)} className="pr-input px-3 py-3" />
                </Field>
                <Field label="Bathrooms">
                  <input value={form.bathrooms} onChange={(event) => setField("bathrooms", event.target.value)} className="pr-input px-3 py-3" />
                </Field>
                <Field label="Square footage" wide>
                  <input value={form.sqft} onChange={(event) => setField("sqft", event.target.value)} className="pr-input px-3 py-3" />
                </Field>
              </div>

              <div>
                <p className="mb-3 text-sm font-bold text-[var(--pr-muted)]">Property type</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {propertyTypeOptions.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setField("propertyType", type)}
                      className={`rounded-lg border p-4 text-left transition ${
                        form.propertyType === type
                          ? "border-[var(--pr-cyan)] bg-[var(--pr-cyan-soft)] text-[var(--pr-text)]"
                          : "border-[var(--pr-border-soft)] bg-[#071010] text-[var(--pr-muted)] hover:border-[rgba(0,251,251,0.35)]"
                      }`}
                    >
                      <span className="font-bold">{type}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <div>
                <p className="pr-kicker text-[var(--pr-cyan)]">Selling points</p>
                <h2 className="mt-1 text-xl font-bold">Features and description</h2>
                <p className="mt-1 text-sm text-[var(--pr-muted)]">Highlight the property details that should influence the generated video.</p>
              </div>

              <div className="grid gap-3 md:grid-cols-4">
                {featureOptions.map((feature) => {
                  const selected = form.features.includes(feature);
                  return (
                    <button
                      key={feature}
                      type="button"
                      onClick={() => toggleFeature(feature)}
                      className={`rounded-md border p-3 text-left text-sm font-bold transition ${
                        selected
                          ? "border-[var(--pr-cyan)] bg-[var(--pr-cyan-soft)] text-[var(--pr-text)]"
                          : "border-[var(--pr-border-soft)] bg-[#071010] text-[var(--pr-muted)] hover:border-[rgba(0,251,251,0.35)]"
                      }`}
                    >
                      {feature}
                    </button>
                  );
                })}
              </div>
              <textarea
                value={form.description}
                onChange={(event) => setField("description", event.target.value)}
                rows={8}
                placeholder="Describe the property, neighborhood, lifestyle, and strongest selling points."
                className="pr-input px-3 py-3"
              />
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <p className="pr-kicker text-[var(--pr-cyan)]">Media</p>
                <h2 className="mt-1 text-xl font-bold">Listing photos</h2>
                <p className="mt-1 text-sm text-[var(--pr-muted)]">Upload 1 to {MAX_LISTING_PHOTOS} strong photos for video generation.</p>
              </div>
              <label
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  uploadFiles(event.dataTransfer.files);
                }}
                className="flex min-h-52 cursor-pointer flex-col items-center justify-center rounded-lg border border-dashed border-[var(--pr-border-soft)] bg-[#071010] p-8 text-center hover:border-[rgba(0,251,251,0.45)]"
              >
                <input type="file" accept="image/*" multiple className="hidden" onChange={(event) => uploadFiles(event.target.files)} />
                <span className="font-bold">{uploading ? "Uploading..." : "Drag photos here or click to upload"}</span>
                <span className="mt-2 text-sm text-[var(--pr-muted)]">Select at least 1 and up to {MAX_LISTING_PHOTOS} listing photos.</span>
              </label>
              <p className={`text-sm ${form.photos.length < 1 ? "text-amber-200" : "text-[var(--pr-muted)]"}`}>
                {form.photos.length}/{MAX_LISTING_PHOTOS} photos selected. You need at least 1 photo to continue to video generation.
              </p>
              <div className="grid gap-3 sm:grid-cols-3 md:grid-cols-4">
                {form.photos.map((photo, index) => (
                  <div key={photo} className="group relative aspect-square overflow-hidden rounded-md border border-[var(--pr-border-soft)]">
                    <img src={photo} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, photos: prev.photos.filter((item) => item !== photo) }))}
                      className="absolute right-2 top-2 rounded-md bg-black/75 px-2 py-1 text-xs font-bold text-white opacity-0 transition group-hover:opacity-100"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {error && <p className="mt-5 rounded-md border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>}
        </section>

        <aside className="pr-section h-fit p-5 xl:sticky xl:top-24">
          <p className="pr-kicker">Listing snapshot</p>
          <h2 className="mt-1 text-xl font-bold">{form.title || "Untitled property"}</h2>
          <p className="mt-2 text-sm leading-6 text-[var(--pr-muted)]">Live preview of the listing data that will carry into the video workflow.</p>

          <div className="mt-5 space-y-3">
            <SnapshotRow label="Price" value={form.price} />
            <SnapshotRow label="Location" value={form.location} />
            <SnapshotRow label="Beds / Baths" value={bedsBaths} />
            <SnapshotRow label="Type" value={form.propertyType} />
            <SnapshotRow label="Photos" value={`${form.photos.length}/${MAX_LISTING_PHOTOS}`} />
          </div>

          <div className="mt-5 rounded-md border border-[var(--pr-gold)]/30 bg-[var(--pr-gold-soft)] p-3">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[var(--pr-gold)]">Next output</p>
            <p className="mt-1 text-sm leading-6 text-[var(--pr-muted)]">After saving, this listing opens directly in the property video generator.</p>
          </div>
        </aside>
      </div>

      <div className="flex justify-between">
        <button disabled={step === 1} onClick={() => setStep((value) => value - 1)} className="pr-secondary px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-30">
          Back
        </button>
        {step < 3 ? (
          <button
            onClick={() => setStep((value) => value + 1)}
            disabled={step === 1 && !propertyFactsComplete}
            className="pr-primary px-4 py-2 text-sm"
          >
            {nextLabel}
          </button>
        ) : (
          <button onClick={submit} disabled={saving || form.photos.length < 1} className="pr-primary px-4 py-2 text-sm">
            {saving ? "Saving..." : "Save property"}
          </button>
        )}
      </div>
    </div>
  );
}
