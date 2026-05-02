import Link from 'next/link';
import {
  Download,
  Bone,
  Layers,
  AlertCircle,
  Save,
  Github,
  ChevronDown,
  ArrowRight,
  Check,
  FileSpreadsheet,
  Edit2,
  Sparkles,
} from 'lucide-react';
import { NativeRedirect } from '@/components/NativeRedirect';

export const dynamic = 'force-static';

const RELEASE_TAG = 'v1.0.0';
const RELEASE_BASE = `https://github.com/Frejustedev/FORMS-TAK/releases/download/${RELEASE_TAG}`;
const WIN_URL = `${RELEASE_BASE}/RegistreMOTAK-1.0.0-portable.exe`;
const ANDROID_URL = `${RELEASE_BASE}/RegistreMOTAK-1.0.0-android.apk`;
const REPO_URL = 'https://github.com/Frejustedev/FORMS-TAK';

function WindowsIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M0 3.5l9.7-1.3v9.7H0V3.5zm10.7-1.5L24 0v11.5H10.7V2zM0 12.7h9.7v9.7L0 21V12.7zm10.7 0H24V24l-13.3-1.8V12.7z" />
    </svg>
  );
}

function AndroidIcon({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.523 15.341c-.6 0-1.084-.483-1.084-1.082s.484-1.083 1.084-1.083 1.083.484 1.083 1.083-.484 1.082-1.083 1.082m-11.046 0c-.6 0-1.084-.483-1.084-1.082s.484-1.083 1.084-1.083 1.083.484 1.083 1.083-.484 1.082-1.083 1.082m11.434-6.024l2.165-3.747a.45.45 0 0 0-.165-.614.452.452 0 0 0-.614.164l-2.193 3.797c-1.677-.766-3.554-1.193-5.604-1.193s-3.927.427-5.604 1.193l-2.193-3.797a.452.452 0 0 0-.614-.164.45.45 0 0 0-.165.614l2.165 3.747C1.499 11.137 0 13.972 0 17.235h24c0-3.263-1.499-6.098-6.089-7.918" />
    </svg>
  );
}

export default function LandingPage() {
  return (
    <main className="bg-white text-slate-900">
      <NativeRedirect />

      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-slate-200/60">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <Bone className="w-4 h-4" />
            </span>
            Registre MO TAK
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition">Fonctionnalités</a>
            <a href="#downloads" className="hover:text-slate-900 transition">Télécharger</a>
            <Link href="/app/" className="hover:text-slate-900 transition">Démo en ligne</Link>
          </nav>
          <a
            href="#downloads"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-semibold shadow-sm hover:bg-slate-700 transition"
          >
            <Download className="w-4 h-4" /> Télécharger
          </a>
        </div>
      </header>

      <section className="relative pt-32 pb-24 overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none opacity-50"
          style={{
            backgroundImage:
              'linear-gradient(to right, rgba(99, 102, 241, 0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(99, 102, 241, 0.08) 1px, transparent 1px)',
            backgroundSize: '56px 56px',
          }}
        />
        <div className="absolute -top-40 -right-32 w-[500px] h-[500px] rounded-full bg-blue-300 blur-[100px] opacity-40 pointer-events-none" />
        <div className="absolute -bottom-32 -left-32 w-[500px] h-[500px] rounded-full bg-indigo-300 blur-[100px] opacity-40 pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold">
              <Sparkles className="w-3 h-3" />
              Nouveau · questionnaire entièrement éditable
            </span>
            <h1 className="text-5xl sm:text-6xl font-extrabold leading-[1.05] tracking-tight">
              Suivi des{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-500 bg-clip-text text-transparent">
                métastases osseuses
              </span>{' '}
              du cancer thyroïdien.
            </h1>
            <p className="text-lg text-slate-600 leading-relaxed max-w-xl">
              Conçu d&apos;après la <strong>Fiche MO TAK</strong>. Chaque champ est modifiable à la volée
              depuis l&apos;application. Les dossiers incomplets sont retrouvables d&apos;un clic, et l&apos;app
              vous ramène <strong>directement</strong> sur le premier champ manquant.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <a
                href={WIN_URL}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold shadow-lg shadow-blue-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <WindowsIcon className="w-5 h-5" />
                Windows
                <span className="text-xs font-normal opacity-80">~130 MB</span>
              </a>
              <a
                href={ANDROID_URL}
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-semibold shadow-lg shadow-emerald-500/30 hover:shadow-xl hover:-translate-y-0.5 transition-all"
              >
                <AndroidIcon className="w-5 h-5" />
                Android (APK)
              </a>
            </div>
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-500 pt-2">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" /> Questionnaire éditable
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" /> Reprise des dossiers
              </span>
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-500" /> 100 % local
              </span>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-blue-500 to-indigo-600 blur-2xl opacity-20" />
            <div className="relative rounded-2xl border border-slate-200 shadow-2xl shadow-slate-900/10 bg-white overflow-hidden">
              <div className="h-9 bg-slate-100 border-b border-slate-200 flex items-center gap-1.5 px-3">
                <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="ml-3 text-xs text-slate-500 font-medium">Registre MO TAK · Dossiers à compléter</span>
              </div>
              <div className="p-5 space-y-3">
                <div className="text-xs text-slate-500 font-medium mb-2">3 dossiers incomplets</div>
                {[
                  { name: 'KHEIRA B.', pct: 78, missing: 'TDM thoracique' },
                  { name: 'AHMED M.', pct: 52, missing: 'Statut vital' },
                  { name: 'NADIA L.', pct: 31, missing: 'TNM initial — N' },
                ].map((p) => (
                  <div key={p.name} className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
                    <div className="flex items-center justify-between text-sm font-semibold mb-1.5">
                      <span>{p.name}</span>
                      <span className="text-xs text-amber-700">Reprendre →</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <div className="flex-1 h-1.5 bg-amber-100 rounded">
                        <div
                          className="h-full rounded bg-gradient-to-r from-amber-400 to-amber-500"
                          style={{ width: `${p.pct}%` }}
                        />
                      </div>
                      <span className="tabular-nums">{p.pct}%</span>
                    </div>
                    <div className="mt-2 text-xs text-slate-600">
                      Reprendre à : <strong>{p.missing}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="py-24 bg-slate-50">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold tracking-wide uppercase">
              Fonctionnalités
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold mt-4 tracking-tight">
              Trois nouveautés majeures par rapport à Registre CDT.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="rounded-2xl bg-white border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Questionnaire éditable</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Ajoutez, supprimez, réordonnez les sections et les champs depuis l&apos;application. Les choix
                prédéfinis s&apos;éditent comme une liste — un par ligne. Versionné automatiquement.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Reprise des dossiers incomplets</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Une page dédiée liste tous les dossiers en cours, triés par taux de complétion. En cliquant,
                vous atterrissez <strong>exactement sur le premier champ manquant</strong>.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
                <Save className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Auto-save permanent</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Plus de brouillons à manipuler — chaque modification est enregistrée automatiquement.
                Fermez l&apos;app à tout moment, vous reprenez là où vous en étiez.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Export Excel dynamique</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                L&apos;export reflète le schéma actuel : si vous ajoutez 12 champs, ils apparaissent dans le
                XLSX automatiquement, dans l&apos;ordre des sections.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                <Edit2 className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Champs conditionnels</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Affichez un champ uniquement si un autre a une valeur précise (ex : « Âge du décès » apparaît
                uniquement si « Décès » = Oui). Configurable via l&apos;éditeur.
              </p>
            </div>
            <div className="rounded-2xl bg-white border border-slate-200 p-6 hover:shadow-lg transition">
              <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
                <Bone className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold mb-2">Pré-rempli avec la Fiche MO TAK</h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Le schéma initial inclut déjà 9 sections et 80+ champs : identification, ATCD, diagnostic
                CDT, métastases, bilan d&apos;extension, cures iode, suivi global, devenir.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section id="downloads" className="py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="max-w-2xl mx-auto text-center mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold tracking-wide uppercase">
              Téléchargement
            </span>
            <h2 className="text-4xl sm:text-5xl font-extrabold mt-4 tracking-tight">Choisissez votre plateforme.</h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
            <div className="rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 p-px shadow-xl">
              <div className="rounded-2xl bg-white p-8 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                    <WindowsIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold">Windows</div>
                    <div className="text-xs text-slate-500">10 / 11 · 64-bit</div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1">
                  Fichier .exe portable, base de données à côté du fichier.
                </p>
                <a
                  href={WIN_URL}
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-semibold transition"
                >
                  <Download className="w-5 h-5" /> Télécharger
                </a>
              </div>
            </div>
            <div className="rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-700 p-px shadow-xl">
              <div className="rounded-2xl bg-white p-8 h-full flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <AndroidIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="font-bold">Android</div>
                    <div className="text-xs text-slate-500">7.0+ · APK</div>
                  </div>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed mb-6 flex-1">
                  APK direct, stockage local sur l&apos;appareil.
                </p>
                <a
                  href={ANDROID_URL}
                  className="inline-flex items-center justify-center gap-2 w-full px-4 py-3 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-600 text-white font-semibold transition"
                >
                  <Download className="w-5 h-5" /> Télécharger l&apos;APK
                </a>
              </div>
            </div>
          </div>
          <p className="text-center text-sm text-slate-500 mt-10">
            <Link href="/app/" className="font-semibold text-slate-900 hover:underline">
              Démo en ligne
            </Link>{' '}
            · code source sur{' '}
            <a href={REPO_URL} className="font-semibold text-slate-900 hover:underline">
              GitHub
            </a>
          </p>
        </div>
      </section>

      <footer className="border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white">
              <Bone className="w-4 h-4" />
            </span>
            <div>
              <div className="font-bold text-slate-900">Registre MO TAK</div>
              <div className="text-xs text-slate-500">© 2026 — Open source</div>
            </div>
          </div>
          <div className="flex items-center gap-6 text-sm text-slate-600">
            <a href={REPO_URL} className="hover:text-slate-900 flex items-center gap-1.5">
              <Github className="w-4 h-4" /> GitHub
            </a>
            <a href={`${REPO_URL}/releases`} className="hover:text-slate-900">
              Versions
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}
