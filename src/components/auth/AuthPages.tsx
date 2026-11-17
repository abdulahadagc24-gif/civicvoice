import { useState, type FormEvent } from 'react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  Compass,
  Eye,
  EyeOff,
  Lock,
  Mail,
  MapPin,
  ShieldCheck,
  User,
  UserCheck,
} from 'lucide-react';
import { KARNATAKA_DISTRICTS } from '../../data/civicData';
import type { AuthUser } from '../../types/civic';

interface AuthPagesProps {
  mode: 'login' | 'signup';
  onSwitchMode: (mode: 'login' | 'signup') => void;
  onAuthenticate: (user: AuthUser) => void;
  onBackToCity: () => void;
}

export function AuthPages({
  mode,
  onSwitchMode,
  onAuthenticate,
  onBackToCity,
}: AuthPagesProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [district, setDistrict] = useState(KARNATAKA_DISTRICTS[0]);
  const [role, setRole] = useState<'citizen' | 'admin'>('citizen');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleModeChange = (nextMode: 'login' | 'signup') => {
    setError('');
    onSwitchMode(nextMode);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setError('Please enter your full name.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }

      onAuthenticate({
        id: `usr-${Date.now()}`,
        name: name.trim(),
        email: trimmedEmail,
        role,
        district: role === 'admin' ? 'Karnataka Municipal Operations' : district,
      });
      return;
    }

    const inferredRole: 'citizen' | 'admin' =
      trimmedEmail.includes('admin') || trimmedEmail.includes('kulkarni')
        ? 'admin'
        : role;

    const derivedName =
      trimmedEmail === 'ananya.rao@civicvoice.ka.gov.in'
        ? 'Ananya Rao'
        : trimmedEmail === 'r.kulkarni@civicvoice.ka.gov.in'
          ? 'Raghavendra Kulkarni'
          : trimmedEmail
              .split('@')[0]
              .replace(/[._-]+/g, ' ')
              .replace(/\b\w/g, (c) => c.toUpperCase());

    onAuthenticate({
      id: `usr-${Date.now()}`,
      name: derivedName,
      email: trimmedEmail,
      role: inferredRole,
      district:
        inferredRole === 'admin'
          ? 'Karnataka Municipal Operations'
          : KARNATAKA_DISTRICTS[0],
    });
  };

  const handleDemoLogin = (demoRole: 'citizen' | 'admin') => {
    if (demoRole === 'admin') {
      onAuthenticate({
        id: 'demo-admin',
        name: 'Raghavendra Kulkarni',
        email: 'r.kulkarni@civicvoice.ka.gov.in',
        role: 'admin',
        district: 'Karnataka Municipal Operations',
      });
    } else {
      onAuthenticate({
        id: 'demo-citizen',
        name: 'Ananya Rao',
        email: 'ananya.rao@civicvoice.ka.gov.in',
        role: 'citizen',
        district: KARNATAKA_DISTRICTS[0],
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F9F6] text-[#0F2920] grid grid-cols-1 lg:grid-cols-12">
      {/* Left Brand & Architectural Showcase Panel */}
      <aside className="hidden lg:flex lg:col-span-5 flex-col justify-between bg-[#0B221A] text-[#E6F2EC] p-10 border-r border-[#123D2E] relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-28 -right-28 h-80 w-80 rounded-full bg-[#10B981]/15 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -bottom-28 -left-20 h-72 w-72 rounded-full bg-[#059669]/20 blur-3xl"
        />

        <div className="relative z-10">
          <button
            type="button"
            onClick={onBackToCity}
            className="inline-flex items-center gap-2 text-xs font-medium text-[#8BB3A1] hover:text-white transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to 3D Smart City Twin</span>
          </button>

          <div className="mt-10 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[#10B981] to-[#059669] text-[#052016] font-display font-bold text-base shadow-[0_4px_14px_rgba(16,185,129,0.4),inset_0_1px_0_rgba(255,255,255,0.45)]">
              CV
            </div>
            <div>
              <div className="font-display text-lg font-bold tracking-tight text-white">
                CivicVoice
              </div>
              <div className="text-xs text-[#8BB3A1]">
                Smart City Governance & Participation
              </div>
            </div>
          </div>

          <h1 className="mt-10 font-display text-3xl font-bold tracking-tight text-white leading-tight">
            Collaborate directly on the future of your neighborhood.
          </h1>
          <p className="mt-3 text-sm text-[#A8C9B9] leading-relaxed">
            Sign in to submit street-level infrastructure proposals, vote on neighborhood improvements, or triage municipal engineering queues.
          </p>

          <div className="mt-10 space-y-4">
            <div className="flex items-start gap-3.5 rounded-xl border border-white/10 bg-[#0F2E23]/80 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#10B981]/20 text-[#34D399]">
                <Compass className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">
                  Interactive 3D Infrastructure Twin
                </div>
                <div className="mt-0.5 text-xs text-[#8BB3A1]">
                  Inspect streetlights, roads, parks, water basins, and eco-waste stations in real time.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl border border-white/10 bg-[#0F2E23]/80 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#10B981]/20 text-[#34D399]">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">
                  Transparent Delivery Milestones
                </div>
                <div className="mt-0.5 text-xs text-[#8BB3A1]">
                  Follow every proposal from community endorsement to municipal field completion.
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3.5 rounded-xl border border-white/10 bg-[#0F2E23]/80 p-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#10B981]/20 text-[#34D399]">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-semibold text-white">
                  Enterprise Municipal Triage
                </div>
                <div className="mt-0.5 text-xs text-[#8BB3A1]">
                  Role-based tools for department routing, SLA tracking, and official citizen updates.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="relative z-10 text-xs text-[#6F9B88] flex items-center justify-between pt-6 border-t border-white/10">
          <span>CivicVoice Karnataka Portal</span>
          <span>Urban Grid v2.4</span>
        </div>
      </aside>

      {/* Right Authentication Form Area */}
      <main className="lg:col-span-7 flex flex-col justify-center items-center px-5 py-8 sm:px-10">
        <div className="w-full max-w-[440px]">
          {/* Mobile Back Header */}
          <div className="flex lg:hidden items-center justify-between mb-6">
            <button
              type="button"
              onClick={onBackToCity}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#065F46] hover:text-[#047857] cursor-pointer"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to 3D City</span>
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#059669] text-white font-display font-bold text-xs">
                CV
              </div>
              <span className="font-display text-sm font-bold text-[#0F2920]">
                CivicVoice
              </span>
            </div>
          </div>

          <div className="rounded-2xl border border-[#DCE7E1] bg-white p-7 sm:p-8 shadow-[0_4px_12px_rgba(12,35,27,0.05),0_20px_40px_-18px_rgba(12,35,27,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]">
            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#F2F7F4] p-1 border border-[#DCE7E1] mb-6">
              <button
                type="button"
                onClick={() => handleModeChange('login')}
                className={`rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-[#065F46] shadow-xs border border-[#DCE7E1]'
                    : 'text-[#527064] hover:text-[#0F2920]'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => handleModeChange('signup')}
                className={`rounded-lg py-2 text-xs font-semibold transition-all cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-white text-[#065F46] shadow-xs border border-[#DCE7E1]'
                    : 'text-[#527064] hover:text-[#0F2920]'
                }`}
              >
                Create Account
              </button>
            </div>

            <div>
              <h2 className="font-display text-2xl font-bold tracking-tight text-[#0F2920]">
                {mode === 'login' ? 'Welcome back' : 'Join CivicVoice'}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-[#527064]">
                {mode === 'login'
                  ? 'Sign in to access your Citizen Portal or Municipal Admin Console.'
                  : 'Create a verified resident or municipal operator account.'}
              </p>
            </div>

            {error && (
              <div
                role="alert"
                className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3.5 py-2.5 text-xs font-medium text-red-700"
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-5 space-y-4">
              {mode === 'signup' && (
                <div>
                  <label
                    htmlFor="auth-name"
                    className="block text-xs font-semibold text-[#0F2920] mb-1.5"
                  >
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B877B]" />
                    <input
                      id="auth-name"
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Ananya Rao"
                      className="w-full rounded-lg border border-[#DCE7E1] bg-[#FAFDFB] pl-9 pr-3 py-2.5 text-xs sm:text-sm text-[#0F2920] placeholder:text-[#8BA398] focus:border-[#059669] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-semibold text-[#0F2920] mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B877B]" />
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@civicvoice.ka.gov.in"
                    className="w-full rounded-lg border border-[#DCE7E1] bg-[#FAFDFB] pl-9 pr-3 py-2.5 text-xs sm:text-sm text-[#0F2920] placeholder:text-[#8BA398] focus:border-[#059669] focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              {mode === 'signup' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="auth-district"
                      className="block text-xs font-semibold text-[#0F2920] mb-1.5"
                    >
                      Karnataka Ward / City
                    </label>
                    <div className="relative">
                      <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6B877B]" />
                      <select
                        id="auth-district"
                        value={district}
                        onChange={(e) => setDistrict(e.target.value)}
                        className="w-full rounded-lg border border-[#DCE7E1] bg-[#FAFDFB] pl-8 pr-2.5 py-2.5 text-xs text-[#0F2920] focus:border-[#059669] focus:bg-white focus:outline-none cursor-pointer"
                      >
                        {KARNATAKA_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F2920] mb-1.5">
                      Account Role
                    </label>
                    <div className="grid grid-cols-2 gap-1 rounded-lg border border-[#DCE7E1] bg-[#FAFDFB] p-1">
                      <button
                        type="button"
                        onClick={() => setRole('citizen')}
                        className={`inline-flex items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                          role === 'citizen'
                            ? 'bg-[#059669] text-white'
                            : 'text-[#527064] hover:text-[#0F2920]'
                        }`}
                      >
                        <UserCheck className="h-3 w-3" />
                        <span>Citizen</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setRole('admin')}
                        className={`inline-flex items-center justify-center gap-1 rounded-md py-1.5 text-[11px] font-semibold transition-colors cursor-pointer ${
                          role === 'admin'
                            ? 'bg-[#059669] text-white'
                            : 'text-[#527064] hover:text-[#0F2920]'
                        }`}
                      >
                        <ShieldCheck className="h-3 w-3" />
                        <span>Admin</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label
                    htmlFor="auth-password"
                    className="block text-xs font-semibold text-[#0F2920]"
                  >
                    Password
                  </label>
                  {mode === 'login' && (
                    <span className="text-[11px] text-[#059669] font-medium">
                      Min. 6 characters
                    </span>
                  )}
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B877B]" />
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    className="w-full rounded-lg border border-[#DCE7E1] bg-[#FAFDFB] pl-9 pr-10 py-2.5 text-xs sm:text-sm text-[#0F2920] placeholder:text-[#8BA398] focus:border-[#059669] focus:bg-white focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-[#6B877B] hover:text-[#0F2920] cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {mode === 'signup' && (
                <div>
                  <label
                    htmlFor="auth-confirm-password"
                    className="block text-xs font-semibold text-[#0F2920] mb-1.5"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <Lock className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6B877B]" />
                    <input
                      id="auth-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter password"
                      className="w-full rounded-lg border border-[#DCE7E1] bg-[#FAFDFB] pl-9 pr-3 py-2.5 text-xs sm:text-sm text-[#0F2920] placeholder:text-[#8BA398] focus:border-[#059669] focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {mode === 'login' && (
                <div className="flex items-center justify-between pt-0.5">
                  <label className="inline-flex items-center gap-2 text-xs text-[#527064] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="h-3.5 w-3.5 rounded border-[#B7CBC0] accent-[#059669] cursor-pointer"
                    />
                    <span>Keep me signed in</span>
                  </label>
                  <div className="flex items-center gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => setRole('citizen')}
                      className={`font-medium cursor-pointer ${
                        role === 'citizen'
                          ? 'text-[#059669] underline'
                          : 'text-[#6B877B] hover:text-[#0F2920]'
                      }`}
                    >
                      Citizen
                    </button>
                    <span className="text-[#CBDAD2]">/</span>
                    <button
                      type="button"
                      onClick={() => setRole('admin')}
                      className={`font-medium cursor-pointer ${
                        role === 'admin'
                          ? 'text-[#059669] underline'
                          : 'text-[#6B877B] hover:text-[#0F2920]'
                      }`}
                    >
                      Admin
                    </button>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full rounded-lg bg-[#059669] px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-[0_2px_8px_rgba(5,150,105,0.3),inset_0_1px_0_rgba(255,255,255,0.25)] hover:bg-[#047857] transition-all cursor-pointer"
              >
                {mode === 'login' ? 'Sign In to CivicVoice' : 'Create CivicVoice Account'}
              </button>
            </form>

            {/* Quick Demo Access */}
            <div className="mt-6 pt-5 border-t border-[#E5EFE9]">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[#6B877B] text-center mb-3">
                Instant Demo Access
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDemoLogin('citizen')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DCE7E1] bg-[#FAFDFB] px-3 py-2 text-xs font-semibold text-[#0F2920] hover:border-[#059669] hover:bg-[#ECFDF5] transition-colors cursor-pointer"
                >
                  <UserCheck className="h-3.5 w-3.5 text-[#059669]" />
                  <span>Citizen Demo</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleDemoLogin('admin')}
                  className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-[#DCE7E1] bg-[#FAFDFB] px-3 py-2 text-xs font-semibold text-[#0F2920] hover:border-[#059669] hover:bg-[#ECFDF5] transition-colors cursor-pointer"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[#059669]" />
                  <span>Admin Demo</span>
                </button>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-[#527064]">
              {mode === 'login' ? (
                <>
                  Need a resident or operator account?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('signup')}
                    className="font-semibold text-[#059669] hover:text-[#047857] cursor-pointer"
                  >
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already registered with CivicVoice?{' '}
                  <button
                    type="button"
                    onClick={() => handleModeChange('login')}
                    className="font-semibold text-[#059669] hover:text-[#047857] cursor-pointer"
                  >
                    Sign in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
