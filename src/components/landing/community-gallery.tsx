import Image from 'next/image'

export function CommunityGallery() {
  return (
    <section id="comunidad" className="py-20 md:py-28 px-4 bg-alsacia-blue-50">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <p className="text-sm font-bold text-alsacia-cyan-500 uppercase tracking-widest mb-3">
            Comunidad
          </p>
          <h2 className="text-3xl md:text-4xl font-bold text-alsacia-blue-800">
            Conoce nuestra comunidad
          </h2>
          <p className="text-gray-600 mt-4 max-w-3xl mx-auto leading-relaxed">
            En Alsacia Running Team somos más que un grupo de corredores: somos vecinos y amigos
            que compartimos la pasión por el running. Entrenamos juntos, celebramos nuestros
            logros y nos motivamos a superar nuevos retos.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          <div className="relative aspect-[3/2] md:aspect-auto md:col-span-2 md:row-span-2 overflow-hidden rounded-2xl shadow-sm">
            <Image
              src="/images/comunidad/foto-grupal.webp"
              alt="Integrantes de Alsacia Running Team posando juntos después de entrenar"
              fill
              className="object-cover"
              sizes="(min-width: 1152px) 750px, (min-width: 768px) 65vw, 100vw"
            />
          </div>
          <div className="relative aspect-[3/2] overflow-hidden rounded-2xl shadow-sm">
            <Image
              src="/images/comunidad/entrenamiento-nocturno.webp"
              alt="Entrenamiento grupal de Alsacia Running Team en la cancha"
              fill
              className="object-cover"
              sizes="(min-width: 1152px) 370px, (min-width: 768px) 32vw, 100vw"
            />
          </div>
          <div className="relative aspect-[3/2] overflow-hidden rounded-2xl shadow-sm">
            <Image
              src="/images/comunidad/equipo-en-carrera.webp"
              alt="Equipo de Alsacia Running Team en una carrera"
              fill
              className="object-cover object-center"
              sizes="(min-width: 1152px) 370px, (min-width: 768px) 32vw, 100vw"
            />
          </div>
        </div>
      </div>
    </section>
  )
}
