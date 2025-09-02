'use client';

import Link from 'next/link';

export default function Doctors() {
  const doctors = [
    {
      id: 1,
      name: 'Dr. Sarah Nakimera',
      specialization: 'Gynecology',
      experience: '15 years',
      clinic: 'Kampala Women\'s Clinic',
      location: 'Kampala',
      image: '/api/placeholder/150/150',
      rating: 4.8,
      available: true
    },
    {
      id: 2,
      name: 'Dr. Grace Muwonge',
      specialization: 'Obstetrics',
      experience: '12 years',
      clinic: 'Mulago Hospital',
      location: 'Kampala',
      image: '/api/placeholder/150/150',
      rating: 4.9,
      available: true
    },
    {
      id: 3,
      name: 'Dr. Elizabeth Nalukenge',
      specialization: 'Family Planning',
      experience: '8 years',
      clinic: 'Jinja Medical Center',
      location: 'Jinja',
      image: '/api/placeholder/150/150',
      rating: 4.7,
      available: false
    },
    {
      id: 4,
      name: 'Dr. Mary Namukasa',
      specialization: 'Gynecology',
      experience: '20 years',
      clinic: 'Mbarara Regional Hospital',
      location: 'Mbarara',
      image: '/api/placeholder/150/150',
      rating: 4.9,
      available: true
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
              <Link href="/doctors" className="text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
                Doctors
              </Link>
              <Link href="/clinics" className="text-gray-700 hover:text-indigo-600 px-3 py-2 rounded-md text-sm font-medium">
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
              <span className="block">Meet Our</span>
              <span className="block text-indigo-600">Healthcare Professionals</span>
            </h1>
            <p className="mt-3 max-w-md mx-auto text-base text-gray-500 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
              Experienced and qualified doctors dedicated to providing the best care for women across Uganda.
            </p>
          </div>
        </div>
      </div>

      {/* Doctors Grid */}
      <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {doctors.map((doctor) => (
            <div key={doctor.id} className="bg-white rounded-lg shadow-lg overflow-hidden">
              <div className="p-6">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                      <svg className="h-8 w-8 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      {doctor.name}
                    </h3>
                    <p className="text-sm text-indigo-600 font-medium">
                      {doctor.specialization}
                    </p>
                  </div>
                </div>
                
                <div className="mt-4">
                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Experience: {doctor.experience}</span>
                    <div className="flex items-center">
                      <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      <span className="ml-1">{doctor.rating}</span>
                    </div>
                  </div>
                  
                  <div className="mt-2 text-sm text-gray-500">
                    <p>{doctor.clinic}</p>
                    <p>{doctor.location}</p>
                  </div>
                  
                  <div className="mt-4 flex items-center justify-between">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      doctor.available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {doctor.available ? 'Available' : 'Unavailable'}
                    </span>
                    
                    {doctor.available && (
                      <Link
                        href="/auth/register"
                        className="inline-flex items-center px-3 py-1 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                      >
                        Book Appointment
                      </Link>
                    )}
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
            <span className="block">Can't find the right doctor?</span>
            <span className="block">Contact us for assistance.</span>
          </h2>
          <p className="mt-4 text-lg leading-6 text-indigo-200">
            Our team can help you find the perfect healthcare provider for your needs.
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
