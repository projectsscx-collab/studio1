import { Phone, MessageCircle } from 'lucide-react';

const Header = () => (
  <header className="bg-red-600 text-white shadow-md">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between h-20">
        <div className="flex-shrink-0">
          <h1 className="text-3xl font-bold tracking-wider">MAPFRE</h1>
        </div>
        <div className="hidden md:flex items-center space-x-8">
            <div className="font-bold text-lg">Full Cover</div>
            <div className="flex items-center space-x-2">
                <Phone size={20}/>
                <span className="font-semibold">Tele Ventas (787) 250-5340</span>
            </div>
             <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-500">
                <MessageCircle size={20} className="text-white" />
            </div>
        </div>
      </div>
    </div>
  </header>
);

export default Header;
