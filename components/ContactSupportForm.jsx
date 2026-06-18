"use client";

import { useState } from "react";

const TOPICS = ["Payment support", "Credit delivery", "Video generation", "Account access", "Refund request", "Other"];

const initialForm = {
  name: "",
  email: "",
  topic: "Payment support",
  packageName: "",
  message: "",
  website: "",
};

export default function ContactSupportForm({ supportEmail }) {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("idle");
  const [notice, setNotice] = useState("");

  function updateField(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setStatus("submitting");
    setNotice("");
    setErrors({});

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          pageUrl: window.location.href,
        }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        setErrors(data.errors || {});
        throw new Error(data.error || "Message could not be sent.");
      }

      setForm(initialForm);
      setStatus("sent");
      setNotice("Message sent. We will reply by email.");
    } catch (error) {
      setStatus("error");
      setNotice(error?.message || "Message could not be sent.");
    }
  }

  const submitting = status === "submitting";

  return (
    <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
      <input
        type="text"
        name="website"
        value={form.website}
        onChange={(event) => updateField("website", event.target.value)}
        className="hidden"
        tabIndex={-1}
        autoComplete="off"
      />

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-bold text-white">
          Name
          <input
            type="text"
            value={form.name}
            onChange={(event) => updateField("name", event.target.value)}
            className="mt-2 w-full rounded-md border border-[var(--pr-border-soft)] bg-[#071010] px-3 py-3 text-sm text-white outline-none transition focus:border-[var(--pr-cyan)]"
            autoComplete="name"
            required
          />
          {errors.name && <span className="mt-1 block text-xs text-amber-200">{errors.name}</span>}
        </label>

        <label className="block text-sm font-bold text-white">
          Email
          <input
            type="email"
            value={form.email}
            onChange={(event) => updateField("email", event.target.value)}
            className="mt-2 w-full rounded-md border border-[var(--pr-border-soft)] bg-[#071010] px-3 py-3 text-sm text-white outline-none transition focus:border-[var(--pr-cyan)]"
            autoComplete="email"
            required
          />
          {errors.email && <span className="mt-1 block text-xs text-amber-200">{errors.email}</span>}
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="block text-sm font-bold text-white">
          Topic
          <select
            value={form.topic}
            onChange={(event) => updateField("topic", event.target.value)}
            className="mt-2 w-full rounded-md border border-[var(--pr-border-soft)] bg-[#071010] px-3 py-3 text-sm text-white outline-none transition focus:border-[var(--pr-cyan)]"
          >
            {TOPICS.map((topic) => (
              <option key={topic} value={topic}>
                {topic}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-bold text-white">
          Package
          <input
            type="text"
            value={form.packageName}
            onChange={(event) => updateField("packageName", event.target.value)}
            placeholder="Optional"
            className="mt-2 w-full rounded-md border border-[var(--pr-border-soft)] bg-[#071010] px-3 py-3 text-sm text-white outline-none transition placeholder:text-[var(--pr-dim)] focus:border-[var(--pr-cyan)]"
          />
        </label>
      </div>

      <label className="block text-sm font-bold text-white">
        Message
        <textarea
          value={form.message}
          onChange={(event) => updateField("message", event.target.value)}
          rows={6}
          className="mt-2 w-full resize-none rounded-md border border-[var(--pr-border-soft)] bg-[#071010] px-3 py-3 text-sm leading-6 text-white outline-none transition focus:border-[var(--pr-cyan)]"
          required
        />
        {errors.message && <span className="mt-1 block text-xs text-amber-200">{errors.message}</span>}
      </label>

      <button type="submit" disabled={submitting} className="pr-primary inline-flex w-full justify-center px-5 py-3 text-sm disabled:cursor-not-allowed disabled:opacity-70">
        {submitting ? "Sending..." : "Send Message"}
      </button>

      {notice && (
        <p className={`text-sm leading-6 ${status === "sent" ? "text-[var(--pr-cyan)]" : "text-amber-200"}`}>
          {notice} {status === "error" ? `You can still email ${supportEmail}.` : ""}
        </p>
      )}
    </form>
  );
}
