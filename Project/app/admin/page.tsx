'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type ContentSection = 'services' | 'projects' | 'products';

type SiteItem = {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string;
  createdAt: string;
};

type SiteProduct = {
  name: string;
  images: string[];
};

type ManagedItem = (SiteItem & { section: 'services' | 'projects' }) | (SiteProduct & { section: 'products' });

type SiteContentResponse = {
  services: SiteItem[];
  projects: SiteItem[];
  products: SiteProduct[];
  contact: ContactForm;
};

type ContactForm = {
  primaryPhone: string;
  secondaryPhone: string;
  email: string;
  officeAddress: string;
};

type ContentForm = {
  title: string;
  description: string;
  category: string;
  section: ContentSection;
};

const initialForm: ContentForm = {
  title: '',
  description: '',
  category: 'General',
  section: 'services',
};

const initialPasswordForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const initialContactForm: ContactForm = {
  primaryPhone: '',
  secondaryPhone: '',
  email: '',
  officeAddress: '',
};

function getManagedItems(content: SiteContentResponse): ManagedItem[] {
  return [
    ...content.services.map((item) => ({ ...item, section: 'services' as const })),
    ...content.projects.map((item) => ({ ...item, section: 'projects' as const })),
    ...content.products.map((product) => ({ ...product, section: 'products' as const })),
  ];
}

function getItemKey(item: ManagedItem) {
  return item.section === 'products' ? `products:${item.name}` : `${item.section}:${item.id}`;
}

export default function AdminPage() {
  const router = useRouter();
  const [items, setItems] = useState<ManagedItem[]>([]);
  const [form, setForm] = useState(initialForm);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [editingItem, setEditingItem] = useState<ManagedItem | null>(null);
  const [status, setStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [passwordForm, setPasswordForm] = useState(initialPasswordForm);
  const [passwordStatus, setPasswordStatus] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [contactForm, setContactForm] = useState(initialContactForm);
  const [contactStatus, setContactStatus] = useState('');
  const [isSavingContact, setIsSavingContact] = useState(false);

  useEffect(() => {
    const loadItems = async () => {
      const sessionResponse = await fetch('/api/auth/session');
      const session = await sessionResponse.json();
      if (!session.authenticated) {
        router.replace('/admin/login');
        return;
      }

      setIsAuthenticated(true);
      setIsCheckingAuth(false);
      const response = await fetch('/api/site-content');
      const data = await response.json();
      setItems(getManagedItems(data));
      setContactForm(data.contact);
    };

    void loadItems();
  }, [router]);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.replace('/admin/login');
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);
    setStatus('');

    try {
      const formData = new FormData();
      formData.append('title', form.title);
      formData.append('description', form.description);
      formData.append('category', form.category);
      formData.append('section', form.section);
      if (form.section === 'products') {
        formData.append('name', form.title);
        if (editingItem?.section === 'products') formData.append('originalName', editingItem.name);
        imageFiles.forEach((image) => formData.append('images', image));
      } else {
        imageFiles[0] && formData.append('image', imageFiles[0]);
        if (editingItem && editingItem.section !== 'products') formData.append('id', editingItem.id);
      }

      const response = await fetch('/api/site-content', {
        method: editingItem ? 'PUT' : 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong.');
      }

      setStatus(editingItem ? 'Content updated successfully.' : 'Content added successfully.');
      setForm(initialForm);
      setEditingItem(null);
      setImageFiles([]);
      setFileInputKey((key) => key + 1);
      const contentResponse = await fetch('/api/site-content');
      const content = await contentResponse.json();
      setItems(getManagedItems(content));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to save content.';
      setStatus(message);
    } finally {
      setIsLoading(false);
    }
  };

  const startEditing = (item: ManagedItem) => {
    setEditingItem(item);
    setForm(item.section === 'products'
      ? { section: 'products', title: item.name, description: '', category: 'General' }
      : { section: item.section, title: item.title, description: item.description, category: item.category });
    setImageFiles([]);
    setFileInputKey((key) => key + 1);
    setStatus('');
  };

  const cancelEditing = () => {
    setEditingItem(null);
    setForm(initialForm);
    setImageFiles([]);
    setFileInputKey((key) => key + 1);
    setStatus('');
  };

  const handleDelete = async (item: ManagedItem) => {
    const title = item.section === 'products' ? item.name : item.title;
    if (!window.confirm(`Delete "${title}"? This cannot be undone.`)) return;

    setIsLoading(true);
    setStatus('');
    try {
      const body = item.section === 'products'
        ? { section: item.section, name: item.name }
        : { section: item.section, id: item.id };
      const response = await fetch('/api/site-content', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to delete content.');

      setItems((current) => current.filter((entry) => getItemKey(entry) !== getItemKey(item)));
      if (editingItem && getItemKey(editingItem) === getItemKey(item)) cancelEditing();
      setStatus('Content deleted.');
    } catch (error) {
      setStatus(error instanceof Error ? error.message : 'Unable to delete content.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPasswordStatus('');
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordStatus('New passwords do not match.');
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword: passwordForm.currentPassword, newPassword: passwordForm.newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to change password.');
      setPasswordForm(initialPasswordForm);
      setPasswordStatus('Password changed successfully.');
    } catch (error) {
      setPasswordStatus(error instanceof Error ? error.message : 'Unable to change password.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleContactSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setContactStatus('');
    setIsSavingContact(true);
    try {
      const response = await fetch('/api/site-content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contactForm),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save contact details.');
      setContactForm(data.contact);
      setContactStatus('Contact and office details saved.');
    } catch (error) {
      setContactStatus(error instanceof Error ? error.message : 'Unable to save contact details.');
    } finally {
      setIsSavingContact(false);
    }
  };

  if (isCheckingAuth || !isAuthenticated) {
    return <main className="flex min-h-screen items-center justify-center bg-slate-950 text-sm text-slate-300">Checking admin access...</main>;
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-10 text-white">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="rounded-3xl border border-slate-800 bg-slate-900 p-8">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-400">Admin dashboard</p>
          <h1 className="mt-3 text-4xl font-bold">Upload content and images</h1>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
            <p className="max-w-2xl text-slate-300">Add new services, projects, and marketing information that will be shown on the public website.</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/" className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300">View website</Link>
              <button type="button" onClick={handleLogout} className="rounded-xl border border-slate-700 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300">Sign out</button>
            </div>
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr]">
          <form onSubmit={handleSubmit} className="space-y-5 rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">Content type</label>
              <select
                value={form.section}
                disabled={Boolean(editingItem)}
                onChange={(event) => {
                  setForm({ ...form, section: event.target.value as ContentSection });
                  setImageFiles([]);
                  setFileInputKey((key) => key + 1);
                }}
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
              >
                <option value="services">Services</option>
                <option value="projects">Projects</option>
                <option value="products">Products</option>
              </select>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">{form.section === 'products' ? 'Product name' : 'Title'}</label>
              <input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                required
                className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
                placeholder="Solar Panel Installation"
              />
            </div>

            {form.section !== 'products' && (
              <>
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Category</label>
                  <input
                    value={form.category}
                    onChange={(event) => setForm({ ...form, category: event.target.value })}
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
                    placeholder="Installation"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-200">Description</label>
                  <textarea
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    rows={5}
                    required
                    className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400"
                    placeholder="Tell visitors about this service or project."
                  />
                </div>
              </>
            )}

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200">{form.section === 'products' ? 'Product images' : 'Image'}</label>
              <input
                key={fileInputKey}
                type="file"
                accept="image/*"
                multiple={form.section === 'products'}
                required={form.section === 'products' && !editingItem}
                onChange={(event) => setImageFiles(Array.from(event.target.files ?? []))}
                className="block w-full rounded-xl border border-dashed border-slate-700 bg-slate-950 px-3 py-3 text-sm text-slate-200 file:mr-3 file:rounded-md file:border-0 file:bg-emerald-500 file:px-3 file:py-2 file:font-semibold file:text-slate-900"
              />
              {editingItem && <p className="mt-2 text-xs text-slate-400">Leave empty to keep the current image{editingItem.section === 'products' ? 's' : ''}.</p>}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-emerald-500 px-5 py-3 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isLoading ? 'Saving...' : editingItem ? 'Save changes' : 'Add content'}
            </button>

            {editingItem && <button type="button" onClick={cancelEditing} className="w-full rounded-xl border border-slate-700 px-5 py-3 font-semibold text-slate-200 transition hover:border-slate-500">Cancel edit</button>}
            {status && <p className="text-sm text-emerald-300">{status}</p>}
          </form>

          <aside className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-2xl font-bold">Manage website content</h2>
            <div className="mt-5 max-h-[1100px] space-y-4 overflow-y-auto pr-1">
              {items.length === 0 ? (
                <p className="text-slate-400">No content added yet.</p>
              ) : (
                [...items].reverse().map((item) => {
                  const title = item.section === 'products' ? item.name : item.title;
                  const image = item.section === 'products' ? item.images[0] : item.image;
                  const description = item.section === 'products' ? 'Product' : item.description;
                  const category = item.section === 'products' ? 'Product' : item.category;
                  return (
                  <article key={getItemKey(item)} className="overflow-hidden rounded-2xl border border-slate-800 bg-slate-950">
                    {image && <img src={image} alt={title} className="h-28 w-full object-cover" />}
                    <div className="p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-400">{item.section} · {category}</p>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => startEditing(item)} aria-label={`Edit ${title}`} className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-200 transition hover:border-emerald-400 hover:text-emerald-300">Edit</button>
                          <button type="button" onClick={() => void handleDelete(item)} disabled={isLoading} aria-label={`Delete ${title}`} className="rounded-lg border border-rose-900 px-3 py-1.5 text-xs font-semibold text-rose-300 transition hover:border-rose-500 disabled:opacity-50">Delete</button>
                        </div>
                      </div>
                      <h3 className="mt-2 text-lg font-semibold text-white">{title}</h3>
                      {item.section !== 'products' && <p className="mt-2 text-sm text-slate-300">{description}</p>}
                    </div>
                  </article>
                  );
                })
              )}
            </div>
          </aside>
        </div>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">Contact and office details</h2>
          <form onSubmit={handleContactSave} className="mt-5 grid gap-4 sm:grid-cols-2">
            <label className="block text-sm font-medium text-slate-200">
              Primary phone
              <input type="tel" value={contactForm.primaryPhone} onChange={(event) => setContactForm({ ...contactForm, primaryPhone: event.target.value })} required className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400" />
            </label>
            <label className="block text-sm font-medium text-slate-200">
              Secondary phone
              <input type="tel" value={contactForm.secondaryPhone} onChange={(event) => setContactForm({ ...contactForm, secondaryPhone: event.target.value })} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400" />
            </label>
            <label className="block text-sm font-medium text-slate-200">
              Email address
              <input type="email" value={contactForm.email} onChange={(event) => setContactForm({ ...contactForm, email: event.target.value })} required className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400" />
            </label>
            <label className="block text-sm font-medium text-slate-200 sm:col-span-2">
              Office address
              <textarea value={contactForm.officeAddress} onChange={(event) => setContactForm({ ...contactForm, officeAddress: event.target.value })} rows={3} required className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400" />
            </label>
            <div className="flex flex-wrap items-center gap-4 sm:col-span-2">
              <button type="submit" disabled={isSavingContact} className="rounded-xl bg-emerald-500 px-5 py-2.5 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70">
                {isSavingContact ? 'Saving...' : 'Save contact details'}
              </button>
              {contactStatus && <p role="status" className="text-sm text-emerald-300">{contactStatus}</p>}
            </div>
          </form>
        </section>

        <section className="rounded-3xl border border-slate-800 bg-slate-900 p-6">
          <h2 className="text-2xl font-bold">Change password</h2>
          <form onSubmit={handlePasswordChange} className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <input type="password" value={passwordForm.currentPassword} onChange={(event) => setPasswordForm({ ...passwordForm, currentPassword: event.target.value })} autoComplete="current-password" required aria-label="Current password" placeholder="Current password" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400" />
            <input type="password" value={passwordForm.newPassword} onChange={(event) => setPasswordForm({ ...passwordForm, newPassword: event.target.value })} autoComplete="new-password" minLength={8} required aria-label="New password" placeholder="New password (8+ characters)" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400" />
            <input type="password" value={passwordForm.confirmPassword} onChange={(event) => setPasswordForm({ ...passwordForm, confirmPassword: event.target.value })} autoComplete="new-password" minLength={8} required aria-label="Confirm new password" placeholder="Confirm new password" className="w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white outline-none focus:border-emerald-400" />
            <button type="submit" disabled={isChangingPassword} className="rounded-xl bg-emerald-500 px-5 py-2.5 font-bold text-slate-950 transition hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-70">
              {isChangingPassword ? 'Updating...' : 'Update password'}
            </button>
          </form>
          {passwordStatus && <p role="status" className="mt-4 text-sm text-emerald-300">{passwordStatus}</p>}
        </section>
      </div>
    </main>
  );
}
