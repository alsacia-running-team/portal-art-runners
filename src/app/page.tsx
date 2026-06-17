import Image from 'next/image'
import Link from 'next/link'
import { ContactSocials } from '@/components/contact-socials'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-alsacia-blue-900/90 backdrop-blur-md border-b border-alsacia-blue-700/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between min-h-16 py-2 sm:h-16 sm:py-0">
            <Image
              src="/images/logo.png"
              alt="Alsacia Running Team"
              width={160}
              height={40}
              className="h-8 w-auto mix-blend-screen"
            />
            <div className="flex flex-col items-end gap-2 sm:flex-row sm:items-center sm:gap-3">
              <Link
                href="/login"
                className="text-sm text-alsacia-blue-100 hover:text-white transition-colors font-medium px-4 py-2"
              >
                Iniciar sesión
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/images/runner-hero.png"
            alt="Alsacia Running Team entrenando"
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-b from-alsacia-blue-900/70 via-alsacia-blue-800/60 to-alsacia-blue-900/90" />

        <div className="relative z-10 text-center px-4 sm:px-6 max-w-4xl mx-auto">
          <div className="mb-8">
            <Image
              src="/images/logo.png"
              alt="Alsacia Running Team"
              width={3427}
              height={841}
              className="mx-auto h-auto w-64 sm:w-80 md:w-96 lg:w-[480px] mix-blend-screen"
              priority
            />
          </div>
          <p className="text-lg sm:text-xl md:text-2xl text-alsacia-cyan-200 mb-10 max-w-2xl mx-auto leading-relaxed">
            Entrenamiento guiado para todos los niveles en ciudad Alsacia, Bogotá.
            Entrena running en comunidad, cerca de tu casa.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/registro"
              className="w-full sm:w-auto bg-alsacia-cyan-400 text-alsacia-blue-900 font-bold px-8 py-4 rounded-xl text-lg hover:bg-alsacia-cyan-300 transition-all hover:scale-105"
            >
              Únete al equipo
            </Link>
            <Link
              href="#planes"
              className="w-full sm:w-auto border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-white/10 transition-all"
            >
              Ver planes
            </Link>
          </div>
        </div>
      </section>

      {/* Qué ofrecemos */}
      <section className="py-20 md:py-28 px-4 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-alsacia-cyan-500 uppercase tracking-widest mb-3">
              Nuestros servicios
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-alsacia-blue-800">
              ¿Porque entrenar con Alsacia Running?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Comunidad real',
                description: 'Entrena con vecinos y se parte de una comunidad que promueve una vida saludablea través del running.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                  </svg>
                ),
              },
              {
                title: 'Entrenamiento real',
                description: 'Planes de entrenamiento estructurados y progresivos para todos los niveles, diseñados por tu entrenador para acompañarte en cada paso de tu proceso.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
                  </svg>
                ),
              },
              {
                title: 'Entrenador certificado',
                description: 'Entrenador certificado por el Colegio Colombiano de Entrenamiento Deportivo COCED y por la International Sports Sciences Association ISSA. Tendrás acompañamiento profesional para que alcances tus metas.',
                icon: (
                  <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                  </svg>
                ),
              },
            ].map((service) => (
              <div key={service.title} className="bg-gray-50 rounded-2xl p-8 hover:shadow-lg transition-shadow">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-alsacia-blue-100 text-alsacia-blue-600 mb-5">
                  {service.icon}
                </div>
                <h3 className="text-xl font-bold text-alsacia-blue-800 mb-3">{service.title}</h3>
                <p className="text-gray-600 leading-relaxed">{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Planes */}
      <section id="planes" className="py-20 md:py-28 px-4 bg-alsacia-blue-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <p className="text-sm font-bold text-alsacia-cyan-500 uppercase tracking-widest mb-3">
              Planes
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-alsacia-blue-800">
              Elige tu plan de entrenamiento
            </h2>
            <p className="text-gray-600 mt-4 max-w-2xl mx-auto">
              Tenemos opciones mensuales y trimestrales que se adaptan a lo que necesitas.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto items-stretch">
            {/* Plan Grupal */}
            <div className="flex flex-col bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow border border-gray-100">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-alsacia-cyan-100 text-alsacia-cyan-600 mb-5">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-alsacia-blue-800 mb-2">Plan Grupal</h3>
              <p className="text-gray-600 mb-6">
                Entrena en equipo, creces en comunidad.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-start mb-8">
                <div className="space-y-3">
                  {[
                    'Entrenamiento presencial guiado por entrenador',
                    'Calendario de entrenamiento en TrainingPeaks',
                    'Sesiones adaptadas a todos los niveles',
                    'Feedback del entrenador en campo',
                    'Ambiente de motivación y compañerismo',
                    'Eventos exclusivos del equipo',
                  ].map((feature) => (
                    <div key={feature} className="flex items-start gap-2 text-sm text-gray-700">
                      <svg className="w-5 h-5 text-alsacia-cyan-500 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      {feature}
                    </div>
                  ))}
                </div>
                <div className="bg-alsacia-blue-50 rounded-xl p-5 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 text-alsacia-blue-700 font-semibold mb-1">
                      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      Horarios
                    </div>
                    <p className="text-sm text-gray-600">Martes y jueves: 5 am y 7 pm</p>
                    <p className="text-sm text-gray-600">Sábados: 7 am</p>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 text-alsacia-blue-700 font-semibold mb-1">
                      <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                      </svg>
                      Ubicación
                    </div>
                    <p className="text-sm text-gray-600">Cancha múltiple al lado de Clínica de La Paz</p>
                    <p className="text-sm text-gray-600">Carrera 69 #12-75</p>
                  </div>
                </div>
              </div>
              <Link
                href="/registro"
                className="mt-auto block text-center bg-alsacia-blue-500 text-white font-semibold px-6 py-3 rounded-xl hover:bg-alsacia-blue-600 transition-colors"
              >
                Empezar ahora
              </Link>
            </div>

            {/* Plan Personalizado */}
            <div className="flex flex-col bg-alsacia-blue-800 rounded-2xl p-8 shadow-sm hover:shadow-lg transition-shadow relative overflow-hidden">
              <div className="absolute top-4 right-4 z-10">
                <span className="bg-alsacia-yellow-400 text-alsacia-blue-900 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Popular
                </span>
              </div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-alsacia-blue-700 text-alsacia-cyan-400 mb-5">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-white mb-2">Plan Personalizado</h3>
              <p className="text-alsacia-blue-200 mb-6">
                Un plan hecho para ti, para tus metas.
              </p>
              <div className="space-y-3 mb-8">
                {[
                  'Plan de entrenamiento 100% personalizado',
                  'Diseñado en TrainingPeaks',
                  'Ajustes semanales según tu progreso',
                  'Seguimiento y feedback del entrenador',
                  'Ideal para objetivos específicos y competencias',
                  'Incluye sesiones de running, fuerza y técnica',
                ].map((feature) => (
                  <div key={feature} className="flex items-start gap-2 text-sm text-alsacia-blue-100">
                    <svg className="w-5 h-5 text-alsacia-cyan-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                    {feature}
                  </div>
                ))}
              </div>
              <Link
                href="/registro"
                className="mt-auto block text-center bg-alsacia-cyan-400 text-alsacia-blue-900 font-bold px-6 py-3 rounded-xl hover:bg-alsacia-cyan-300 transition-colors"
              >
                Empezar ahora
              </Link>
            </div>
          </div>

          <p className="text-center text-gray-500 text-sm mt-8">
            Los precios se informan al momento del registro. Consulta con el entrenador para más detalles.
          </p>
        </div>
      </section>

      {/* CTA Final */}
      <section className="relative py-20 md:py-28 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-alsacia-blue-800" />
        <div className="absolute inset-0 opacity-10">
          <Image
            src="/images/runner-hero.png"
            alt=""
            fill
            className="object-cover"
            sizes="100vw"
          />
        </div>
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-12">
            ¿Listo para correr con nosotros?
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/registro"
              className="w-full sm:w-auto bg-alsacia-cyan-400 text-alsacia-blue-900 font-bold px-8 py-4 rounded-xl text-lg hover:bg-alsacia-cyan-300 transition-all hover:scale-105"
            >
              Quiero unirme
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto border-2 border-white/30 text-white font-semibold px-8 py-4 rounded-xl text-lg hover:bg-white/10 transition-all"
            >
              Ya tengo cuenta
            </Link>
          </div>

          <ContactSocials />
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-alsacia-blue-900 py-10 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <Image
                src="/images/logo.png"
                alt="Alsacia Running Team"
                width={140}
                height={35}
                className="h-8 w-auto mix-blend-screen"
              />
            </div>
            <div className="flex items-center gap-6">
              <Link href="/login" className="text-sm text-alsacia-blue-300 hover:text-white transition-colors">
                Iniciar sesión
              </Link>
              <Link href="/registro" className="text-sm text-alsacia-blue-300 hover:text-white transition-colors">
                Registrarse
              </Link>
            </div>
          </div>
          <div className="mt-8 pt-6 border-t border-alsacia-blue-800 text-center">
            <p className="text-sm text-alsacia-blue-400">
              © {new Date().getFullYear()} Alsacia Running Team. Todos los derechos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
