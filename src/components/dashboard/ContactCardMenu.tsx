export default function ContactCard() {
  return (
    <div className="relative bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg p-4 text-white shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="mb-6">
        <h3 className="text-xl font-bold bg-gradient-to-r from-white to-purple-200 bg-clip-text text-transparent mb-1">
          Get in Touch
        </h3>
        <div className="w-12 h-1 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full"></div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">

        {/* Email */}
        <div className="flex items-center space-x-3 group hover:translate-x-1 transition-transform duration-200">
          <div className="bg-blue-500/20 p-2 rounded-lg group-hover:bg-blue-500/30 transition-colors flex items-center justify-center">
            <svg className="w-4 h-4 text-blue-300" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
            </svg>
          </div>
          <div>
            {/* <p className="text-xs text-blue-200 mb-1">Email</p> */}
            <a href="mailto:sales@graaho.com" className="text-sm font-medium hover:text-blue-300 transition-colors">
              sales@graaho.com
            </a>
          </div>
        </div>

        {/* Address */}
        <div className="flex items-start space-x-3 group hover:translate-x-1 transition-transform duration-200">
          <div className="bg-emerald-500/20 p-2 rounded-lg group-hover:bg-emerald-500/30 transition-colors flex items-center justify-center">
            <svg className="w-4 h-4 text-emerald-300" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd"/>
            </svg>
          </div>
          <div>
            {/* <p className="text-xs text-emerald-200 mb-1">Address</p> */}
            <address className="text-sm font-medium not-italic leading-relaxed text-white/90">
              1530 Wilson Blvd,<br />
              Suite 650,<br />
              Arlington VA 22209
            </address>
          </div>
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute -top-1 -right-1 w-20 h-20 bg-purple-500/10 rounded-full blur-xl"></div>
      <div className="absolute -bottom-2 -left-2 w-16 h-16 bg-blue-500/10 rounded-full blur-lg"></div>
    </div>
  );
}