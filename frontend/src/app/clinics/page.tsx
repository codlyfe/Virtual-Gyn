'use client';

import Link from 'next/link';

export default function Clinics() {
  const clinics = [
    {
      id: 1,
      name: 'Kampala Women\'s Clinic',
      address: 'Plot 123, Kampala Road, Kampala',
      phone: '+256 123 456 789',
      email: 'info@kampalawomensclinic.com',
      services: ['Gynecology', 'Obstetrics', 'Family Planning'],
      rating: 4.8,
      doctors: 12,
      isActive: true
    },
    {
      id: 2,
      name: 'Mulago Hospital',
      address: 'Mulago Hill, Kampala',
      phone: '+256 123 456 790',
      email: 'info@mulagohospital.com',
      services: ['Gynecology', 'Obstetrics', 'Emergency Care'],
      rating: 4.9,
      doctors: 25,
      isActive: true
    },
    {
      id: 3,
      name: 'Jinja Medical Center',
      address: 'Main Street, Jinja',
      phone: '+256 123 456 791',
      email: 'info@jinjamedical.com',
      services: ['Gynecology', 'Family Planning', 'Preventive Care'],
      rating: 4.7,
      doctors: 8,
      isActive: true
    },
    {
      id: 4,
      name: 'Mbarara Regional Hospital',
      address: 'Mbarara Town, Western Uganda',
      phone: '+256 123 456 792',
      email: 'info@mbararahospital.com',
      services: ['Gynecology', 'Obstetrics', 'Surgery'],
      rating: 4.6,
      doctors: 15,
      isActive: true
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-indigo-600">
                Uganda Gynecology Platform
              </Link>
            </div>
            <div className="flex items-center space-x-8">
              <Link href="/" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                Home
              </Link>
              <Link href="/services" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                Services
              </Link>
              <Link href="/doctors" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                Doctors
              </Link>
              <Link href="/clinics" className="text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                Clinics
              </Link>
              <Link href="/auth/login" className="bg-indigo-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-indigo-700">
                Login
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
              <span className="block">Our Healthcare</span>
              <span className="block text-indigo-600">Facilities</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              State-of-the-art medical facilities across Uganda providing comprehensive women's healthcare services.
            </p>
          </div>
        </div>
      </div>

      {/* Clinics Grid */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-2">
          {clinics.map((clinic) => (
            <div key={clinic.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <svg className="h-8 w-8 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {clinic.name}
                    </h3>
                    <div className="flex items-center mt-1">
                      <div className="flex items-center">
                        <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                        <span className="ml-1 text-sm text-gray-600">{clinic.rating}</span>
                      </div>
                      <span className="mx-2 text-gray-300">•</span>
                      <span className="text-sm text-gray-600">{clinic.doctors} doctors</span>
                    </div>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="text-sm text-gray-500">
                    <p className="flex items-center">
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {clinic.address}
                    </p>
                    <p className="flex items-center mt-1">
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                      </svg>
                      {clinic.phone}
                    </p>
                    <p className="flex items-center mt-1">
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      {clinic.email}
                    </p>
                  </div>
                  
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Services:</h4>
                    <div className="flex flex-wrap gap-2">
                      {clinic.services.map((service, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800"
                        >
                          {service}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-6 flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      clinic.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {clinic.isActive ? 'Open' : 'Closed'}
                    </span>
                    
                    <Link
                      href="/auth/register"
                      className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                    >
                      Book Appointment
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-indigo-700">
        <div className="max-w-2xl mx-auto text-center py-16 px-4 sm:py-20 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            <span className="block">Need help finding a clinic?</span>
            <span className="block">Contact us for assistance.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-indigo-200">
            Our team can help you find the perfect healthcare facility for your needs.
          </p>
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-md shadow">
              <Link
                href="/auth/register"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-indigo-600 bg-white hover:bg-indigo-50"
              >
                Get started
              </Link>
            </div>
            <div className="ml-3 inline-flex">
              <Link
                href="/contact"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-indigo-500 bg-opacity-60 hover:bg-opacity-70"
              >
                Contact us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8">
          <div className="xl:grid xl:grid-cols-3 xl:gap-8">
            <div className="space-y-8 xl:col-span-1">
              <h3 className="text-2xl font-bold text-white">
                Uganda Gynecology Platform
              </h3>
              <p className="text-gray-300 text-base">
                Empowering women's healthcare across Uganda with comprehensive digital solutions.
              </p>
            </div>
            <div className="mt-12 grid grid-cols-2 gap-8 xl:mt-0 xl:col-span-2">
              <div className="md:grid md:grid-cols-2 md:gap-8">
                <div>
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                    Services
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <Link href="/services" className="text-base text-gray-300 hover:text-white">
                        Gynecology
                      </Link>
                    </li>
                    <li>
                      <Link href="/services" className="text-base text-gray-300 hover:text-white">
                        Obstetrics
                      </Link>
                    </li>
                    <li>
                      <Link href="/services" className="text-base text-gray-300 hover:text-white">
                        Family Planning
                      </Link>
                    </li>
                  </ul>
                </div>
                <div className="mt-12 md:mt-0">
                  <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">
                    Support
                  </h3>
                  <ul className="mt-4 space-y-4">
                    <li>
                      <Link href="/contact" className="text-base text-gray-300 hover:text-white">
                        Contact Us
                      </Link>
                    </li>
                    <li>
                      <Link href="/help" className="text-base text-gray-300 hover:text-white">
                        Help Center
                      </Link>
                    </li>
                    <li>
                      <Link href="/privacy" className="text-base text-gray-300 hover:text-white">
                        Privacy Policy
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
          <div className="mt-12 border-t border-gray-700 pt-8">
            <p className="text-base text-gray-400 xl:text-center">
              &copy; 2024 Uganda Gynecology Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
