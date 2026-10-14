import Image from 'next/image'

const HIGHLIGHTS = [
  { value: '+17', label: 'años de experiencia como corredor de fondo' },
  { value: '16+', label: 'maratones, 5 de ellos World Marathon Majors' },
  { value: '7', label: 'ultramaratones completadas' },
]

const CERTIFICATIONS = ['Certificado ISSA', 'Licencia COCED']

export function TrainerProfile() {
  return (
    <section id="entrenador" className="py-20 md:py-28 px-4 bg-white">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] gap-10 lg:gap-16 items-center">
          {/* Foto */}
          <div className="relative max-w-sm mx-auto md:max-w-none w-full">
            <div
              className="absolute -bottom-3 -right-3 md:-bottom-4 md:-right-4 w-full h-full rounded-2xl bg-alsacia-cyan-100"
              aria-hidden="true"
            />
            <div className="relative aspect-[4/5] overflow-hidden rounded-2xl shadow-lg">
              <Image
                src="/images/entrenador/eduar-guchuvo.webp"
                alt="Eduar Guchuvo, fundador y entrenador de Alsacia Running Team"
                fill
                className="object-cover object-top"
                sizes="(min-width: 768px) 40vw, 90vw"
              />
            </div>
          </div>

          {/* Perfil */}
          <div>
            <p className="text-sm font-bold text-alsacia-cyan-500 uppercase tracking-widest mb-3">
              Tu entrenador
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-alsacia-blue-800">
              Eduar Guchuvo
            </h2>
            <p className="mt-2 text-lg font-semibold text-alsacia-blue-600">
              Fundador de Alsacia Running Team | Running Coach
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              {CERTIFICATIONS.map((certification) => (
                <span
                  key={certification}
                  className="rounded-full bg-alsacia-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-alsacia-blue-700"
                >
                  {certification}
                </span>
              ))}
            </div>

            <div className="mt-6 space-y-4 text-gray-600 leading-relaxed">
              <p>
                Soy entrenador de running certificado por ISSA, cuento con licencia de COCED y
                tengo más de 17 años de experiencia como corredor de fondo, tanto en asfalto como
                en trail running de ultradistancia.
              </p>
              <p>
                A lo largo de mi trayectoria deportiva he completado más de 16 maratones, incluyendo
                cinco de las prestigiosas World Marathon Majors, además de siete ultramaratones y
                participaciones en competencias de triatlón.
              </p>
              <p>
                Soy fundador de Alsacia Running Team, donde desde hace más de dos años acompaño a
                corredores de diferentes niveles en su preparación deportiva, promoviendo el
                entrenamiento estructurado, la constancia y el trabajo en equipo.
              </p>
              <p>
                Mi propósito es ayudarte a entrenar de manera estructurada, comprender tu proceso y
                avanzar hacia tus objetivos, sin importar si estás dando tus primeros pasos en el
                running o buscando superar tus marcas personales.
              </p>
              <p>
                Creo que correr es mucho más que acumular kilómetros: es una oportunidad para
                superarnos, compartir experiencias y construir amistades dentro de una comunidad
                que disfruta correr.
              </p>
            </div>

            <dl className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {HIGHLIGHTS.map((item) => (
                <div key={item.label} className="rounded-2xl bg-gray-50 p-5">
                  <dt className="text-3xl font-bold text-alsacia-blue-700">{item.value}</dt>
                  <dd className="mt-1 text-sm text-gray-600 leading-snug">{item.label}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </div>
    </section>
  )
}
