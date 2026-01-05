import Link from 'next/link';
import { ArrowRight, Shield, Zap, Globe } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      <nav className="border-b border-white/5 bg-surface/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="font-bold text-xl tracking-tight">
            GENESIS <span className="text-accent">GATES</span>
          </div>
          <div className="flex gap-4">
            <Link href="/login" className="px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors">
              Sign In
            </Link>
            <Link href="/login" className="px-4 py-2 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded-lg transition-all shadow-[0_0_15px_-3px_var(--color-accent)]">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col items-center justify-center text-center px-6 py-20 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-accent/20 rounded-full blur-[100px] -z-10" />
        <h1 className="text-5xl md:text-7xl font-bold max-w-4xl tracking-tight mb-6">
          The Future of <span className="text-accent bg-clip-text text-transparent bg-gradient-to-r from-accent to-purple-400">Digital Assets</span>
        </h1>
        <p className="text-lg md:text-xl text-white/60 max-w-2xl mb-10 leading-relaxed">
          Secure, decentralized, and built for the next generation. Manage your portfolio with enterprise-grade security.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/login" className="px-8 py-4 bg-white text-surface font-bold rounded-xl hover:bg-gray-200 transition-colors flex items-center gap-2">
            Start Building <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-7xl mx-auto mt-32 w-full">
          {[
            { icon: Shield, title: "Bank-Grade Security", desc: "Your assets are protected by industry-leading encryption standards." },
            { icon: Zap, title: "Lightning Fast", desc: "Experience zero-latency transactions across global networks." },
            { icon: Globe, title: "Universal Access", desc: "Connect from anywhere using your preferred wallet or email." },
          ].map((feature, i) => (
            <div key={i} className="glass-panel p-8 flex flex-col items-start gap-4">
              <div className="p-3 bg-accent/10 rounded-lg">
                <feature.icon className="w-6 h-6 text-accent" />
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="text-white/60">{feature.desc}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}