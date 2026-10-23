import {useState, type FormEvent} from 'react';
import {Link, useNavigate} from 'react-router-dom';
import {Eye, EyeOff, Heart, HeartHandshake, ArrowRight, LockKeyhole, Mail, ShieldCheck, Sparkles} from 'lucide-react';
import {signInWithEmailAndPassword, signOut} from 'firebase/auth';
import {doc, getDoc} from 'firebase/firestore';
import {auth, db} from '../../services/firebase';
import './login.css';

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError('');
    if (!auth || !db) {
      setError('O acesso por conta ainda não está configurado. Enquanto isso, você pode conhecer as áreas de demonstração abaixo.');
      return;
    }
    setBusy(true);
    try {
      const {user} = await signInWithEmailAndPassword(auth, email.trim(), password);
      try {
        const profile = await getDoc(doc(db, 'users', user.uid));
        const data = profile.data();
        if (!profile.exists() || data?.active !== true || !['admin', 'doctor', 'patient'].includes(data?.role)) {
          throw new Error('profile-unavailable');
        }
        navigate(`/${data.role}/dashboard`, {replace: true});
      } catch (profileError) {
        await signOut(auth);
        if (profileError instanceof Error && profileError.message === 'profile-unavailable') {
          setError('Sua conta não possui um perfil ativo. Solicite a liberação ao administrador.');
        } else {
          setError('Não foi possível carregar seu perfil. Tente novamente em alguns instantes.');
        }
      }
    } catch (cause) {
      const code = (cause as {code?: string}).code;
      setError(code === 'auth/too-many-requests'
        ? 'Muitas tentativas de acesso. Aguarde um pouco antes de tentar novamente.'
        : code === 'auth/network-request-failed'
          ? 'Não foi possível conectar. Verifique sua conexão e tente novamente.'
          : 'Não foi possível entrar. Confira seu e-mail e sua senha e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-page">
    <section className="login-story" aria-label="Boas-vindas ao Maternal Care">
      <Link to="/login" className="login-brand"><span className="brand-icon"><HeartHandshake size={26}/></span><span>maternal<span>care</span><small>Cuidando de cada etapa</small></span></Link>
      <div className="login-story-content">
        <span className="login-kicker"><Sparkles size={15}/> CUIDADO QUE ACOLHE</span>
        <h1>Cada jornada é única.<br/><span>O cuidado também.</span></h1>
        <p>Um espaço para acolher suas dúvidas, acompanhar cada etapa e aproximar você de quem cuida da sua saúde.</p>
        <div className="login-illustration" aria-hidden="true"><span className="login-orbit orbit-one"/><span className="login-orbit orbit-two"/><div className="login-heart"><Heart size={76} strokeWidth={1.1}/></div><span className="login-floating-note"><HeartHandshake size={20}/> Mais perto, em cada etapa</span><Sparkles className="login-sparkle" size={30}/></div>
        <div className="login-story-footer"><ShieldCheck size={18}/><span>Acolhimento para gestantes.<br/>Conexão para profissionais.</span></div>
      </div>
      <small className="login-story-caption">Uma jornada mais leve começa com cuidado.</small>
    </section>

    <section className="login-form-side" aria-labelledby="login-title">
      <div className="login-card">
        <span className="login-welcome-icon"><HeartHandshake size={28}/></span>
        <span className="eyebrow">BEM-VINDA DE VOLTA</span>
        <h2 id="login-title">Que bom ter você aqui.</h2>
        <p className="login-intro">Entre na sua conta para continuar sua jornada de cuidado.</p>
        <form onSubmit={submit} aria-busy={busy}>
          <label className="field-label" htmlFor="login-email">E-mail</label>
          <div className="login-input"><Mail size={18}/><input id="login-email" type="email" autoComplete="username" placeholder="Seu e-mail" required maxLength={254} value={email} onChange={event => setEmail(event.target.value)} disabled={busy}/></div>
          <label className="field-label" htmlFor="login-password">Senha</label>
          <div className="login-input"><LockKeyhole size={18}/><input id="login-password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" placeholder="Sua senha" required value={password} onChange={event => setPassword(event.target.value)} disabled={busy}/><button type="button" className="login-password-toggle" onClick={() => setShowPassword(!showPassword)} aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'} aria-pressed={showPassword}>{showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}</button></div>
          <p className="login-help">Precisa de acesso ou esqueceu sua senha? Fale com o administrador da plataforma.</p>
          {error && <div className="login-error" role="alert">{error}</div>}
          <button className="primary-btn login-submit" type="submit" disabled={busy}>{busy ? 'Entrando…' : 'Entrar na minha conta'}{!busy && <ArrowRight size={18}/>}</button>
        </form>
        <div className="login-demo"><span>Conheça a plataforma</span><p>Explore as telas com dados fictícios, sem precisar de uma conta.</p><div><Link to="/patient/dashboard">Sou gestante <ArrowRight size={15}/></Link><Link to="/doctor/dashboard">Sou profissional <ArrowRight size={15}/></Link></div><Link className="login-admin-link" to="/admin/dashboard">Explorar administração <ArrowRight size={15}/></Link></div>
        <p className="login-disclaimer"><ShieldCheck size={15}/> O acompanhamento digital complementa o cuidado da sua equipe de saúde.</p>
      </div>
      <footer className="login-footer">Maternal Care · Feito para cuidar de cada etapa.</footer>
    </section>
  </main>;
}
