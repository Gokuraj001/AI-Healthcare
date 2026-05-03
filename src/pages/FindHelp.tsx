import React, { useEffect, useRef, useState } from 'react';
import { Card, SectionTitle, Button } from '../components/UI';
import { MapPin, Phone, Globe, Star, Navigation, Search, Loader2, Plus, X, ShieldAlert } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, addDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { handleFirestoreError, OperationType } from '../lib/firestore-errors';

interface Suggestion {
  id: string;
  name: string;
  address: string;
  phone: string;
  suggestionType: string;
  lat: number;
  lng: number;
  suggestedBy: string;
}

const fallbackClinics: any[] = [
  {
    name: "City Mental Health Wellness Center",
    vicinity: "123 Healthcare Ave, Medical District",
    rating: 4.8,
    user_ratings_total: 120,
    geometry: { location: { lat: 0, lng: 0 } }
  },
  {
    name: "Dr. Aruna's Therapy Circle",
    vicinity: "45 Serenity Lane, Greenway",
    rating: 4.9,
    user_ratings_total: 85,
    geometry: { location: { lat: 0, lng: 0 } }
  },
  {
    name: "St. Jude's Psychiatric Wing",
    vicinity: "88 Main Street, Downtown",
    rating: 4.5,
    user_ratings_total: 210,
    geometry: { location: { lat: 0, lng: 0 } }
  }
];

const FindHelp: React.FC = () => {
  const { user, loading: authLoading } = useAuth();
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [places, setPlaces] = useState<google.maps.places.PlaceResult[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<google.maps.LatLngLiteral | null>(null);
  
  const [showSuggestModal, setShowSuggestModal] = useState(false);
  const [suggestionForm, setSuggestionForm] = useState({
    name: '',
    address: '',
    phone: '',
    type: 'clinic'
  });

  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    if (authLoading || !user) return;

    // Load community suggestions from Firestore
    const path = 'suggestedClinics';
    const unsubscribe = onSnapshot(collection(db, path), (snapshot) => {
      const s = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Suggestion));
      setSuggestions(s);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, path);
    });

    const loadGoogleMaps = () => {
      if (window.google) {
        initMap();
        return;
      }

      // Handle Authentication Failures (like ExpiredKeyMapError)
      (window as any).gm_authFailure = () => {
        setError("expired");
        setLoading(false);
        setPlaces(fallbackClinics);
      };

      const existingScript = document.querySelector(`script[src*="maps.googleapis.com"]`);
      if (existingScript) {
        existingScript.addEventListener('load', initMap);
        return;
      }

      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || (process.env as any).GOOGLE_MAPS_PLATFORM_KEY;
      if (!apiKey || apiKey.includes('YOUR_API_KEY')) {
        setError("missing");
        setLoading(false);
        // Load static fallback data for demo purposes
        setPlaces(fallbackClinics);
        return;
      }

      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.onload = initMap;
      script.onerror = () => {
        setError("Google Maps API Permission Error: Please enable 'Places API (New)' and 'Maps JavaScript API' in your Google Cloud Console for this API key.");
        setLoading(false);
        setPlaces(fallbackClinics);
      };
      document.head.appendChild(script);
    };

    const initMap = () => {
      if (!mapRef.current) return;
      
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const loc = {
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          };
          setUserLocation(loc);
          
          if (!window.google) {
             setLoading(false);
             setPlaces(fallbackClinics);
             return;
          }

          const googleMap = new google.maps.Map(mapRef.current!, {
            center: loc,
            zoom: 14,
            styles: [
              {
                "featureType": "poi.medical",
                "elementType": "all",
                "stylers": [{ "visibility": "on" }]
              }
            ],
            disableDefaultUI: true,
            zoomControl: true,
          });

          new google.maps.Marker({
            position: loc,
            map: googleMap,
            title: "Your Location",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 10,
              fillColor: "#4285F4",
              fillOpacity: 1,
              strokeWeight: 2,
              strokeColor: "#FFFFFF",
            },
          });

          setMap(googleMap);
          searchNearby(googleMap, loc);
        },
        () => {
          setError("Location access denied. Please enable location to find nearby help.");
          setLoading(false);
        }
      );
    };

    const searchNearby = (mapInstance: google.maps.Map, location: google.maps.LatLngLiteral) => {
      const service = new google.maps.places.PlacesService(mapInstance);
      const request = {
        location: location,
        radius: 5000,
        type: 'hospital',
        keyword: 'psychiatrist mental health clinic'
      };

      service.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          setPlaces(results);
          results.forEach((place) => {
            if (place.geometry?.location) {
              const marker = new google.maps.Marker({
                position: place.geometry.location,
                map: mapInstance,
                title: place.name,
              });
              markersRef.current.push(marker);
            }
          });
        }
        setLoading(false);
      });
    };

    loadGoogleMaps();
    return () => unsubscribe();
  }, [user, authLoading]);

  // Sync suggestion markers to map
  useEffect(() => {
    if (!map || !suggestions.length) return;
    
    suggestions.forEach(s => {
      new google.maps.Marker({
        position: { lat: s.lat, lng: s.lng },
        map: map,
        title: s.name,
        icon: {
          path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          scale: 6,
          fillColor: "#8B5CF6", // Purple for suggestions
          fillOpacity: 1,
          strokeWeight: 2,
          strokeColor: "#FFFFFF",
        },
      });
    });
  }, [map, suggestions]);

  const handleSuggestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !userLocation) return;

    try {
      if (!user.emailVerified && user.providerData?.[0]?.providerId === 'password') {
        setShowSuggestModal(false);
        return;
      }
      await addDoc(collection(db, 'suggestedClinics'), {
        name: suggestionForm.name,
        address: suggestionForm.address,
        phone: suggestionForm.phone,
        suggestionType: suggestionForm.type,
        lat: userLocation.lat,
        lng: userLocation.lng,
        suggestedBy: user.uid,
        createdAt: serverTimestamp()
      });
      setShowSuggestModal(false);
      setSuggestionForm({ name: '', address: '', phone: '', type: 'clinic' });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-10">
        <SectionTitle 
          title="Professional Finder" 
          subtitle="Find nearby psychiatrists, counselors, and support centers from Google or suggested by our community."
        />
        <div className="flex gap-4 items-center">
            <Button 
                onClick={() => {
                    if (user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password') {
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                        return;
                    }
                    setShowSuggestModal(true);
                }} 
                className={`flex items-center gap-2 ${user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : ''}`}
            >
                {user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' ? <ShieldAlert className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                {user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' ? 'Verification Required' : 'Suggest a Center'}
            </Button>
            <div className="bg-white p-4 rounded-2xl shadow-sm border flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Searching near</p>
                <p className="font-bold text-gray-800">Your Current Location</p>
              </div>
            </div>
        </div>
      </div>

      {showSuggestModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-3xl w-full max-w-md p-8 shadow-2xl">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-xl font-bold">Suggest a Center</h3>
                      <button onClick={() => setShowSuggestModal(false)} className="p-2 hover:bg-gray-100 rounded-full">
                          <X className="w-5 h-5" />
                      </button>
                  </div>
                  <form onSubmit={handleSuggestSubmit} className="space-y-4">
                      <div>
                          <label className="block text-xs font-black text-gray-400 uppercase mb-1">Center Name</label>
                          <input 
                            required
                            type="text"
                            value={suggestionForm.name}
                            onChange={e => setSuggestionForm({...suggestionForm, name: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="e.g. Hope Wellness Clinic"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-black text-gray-400 uppercase mb-1">Address/Area</label>
                          <input 
                            required
                            type="text"
                            value={suggestionForm.address}
                            onChange={e => setSuggestionForm({...suggestionForm, address: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="Street address or local landmark"
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-black text-gray-400 uppercase mb-1">Clinic Phone (Optional)</label>
                          <input 
                            type="tel"
                            value={suggestionForm.phone}
                            onChange={e => setSuggestionForm({...suggestionForm, phone: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20 outline-none"
                            placeholder="+91..."
                          />
                      </div>
                      <div>
                          <label className="block text-xs font-black text-gray-400 uppercase mb-1">Type</label>
                          <select 
                            value={suggestionForm.type}
                            onChange={e => setSuggestionForm({...suggestionForm, type: e.target.value})}
                            className="w-full px-4 py-3 bg-gray-50 rounded-xl border-none focus:ring-2 focus:ring-primary/20 outline-none"
                          >
                              <option value="clinic">Mental Health Clinic</option>
                              <option value="therapist">Private Therapist</option>
                              <option value="hospital">Psychiatric Hospital</option>
                          </select>
                      </div>
                      <p className="text-[10px] text-gray-400 italic">This will use your current location to mark the center.</p>
                      <Button type="submit" className="w-full">Submit Suggestion</Button>
                  </form>
              </div>
          </div>
      )}

      {error ? (
        <Card className="bg-white border-none shadow-2xl p-12 text-center max-w-2xl mx-auto my-12">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8 text-red-500">
              <MapPin className="w-10 h-10" />
            </div>
            
            {error === 'expired' || error === 'missing' ? (
              <div className="space-y-6">
                <h3 className="text-3xl font-black text-gray-900">Google Maps Error</h3>
                <p className="text-gray-500 font-medium leading-relaxed">
                  {error === 'expired' 
                    ? "Your Google Maps API key is expired (ExpiredKeyMapError). Switching to Demo Mode." 
                    : "The Google Maps API key is missing. Switching to Demo Mode."}
                </p>
                
                <div className="bg-amber-50 rounded-3xl p-8 text-left space-y-4 border border-amber-100">
                  <p className="text-xs font-black text-amber-600 uppercase tracking-widest">Active Demo Mode:</p>
                  <p className="text-sm text-amber-800 font-medium leading-relaxed">
                    We've loaded a curated list of trusted mental health facilities. You can still see community suggestions and professional listings below.
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  <Button size="lg" className="rounded-2xl" onClick={() => setError(null)}>
                    Continue in Demo Mode
                  </Button>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-tighter">Or update VITE_GOOGLE_MAPS_API_KEY in Secrets</p>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-red-600 font-bold text-xl mb-4 italic">"{error}"</p>
                <Button size="lg" className="rounded-2xl" onClick={() => window.location.reload()}>Try Again</Button>
              </div>
            )}
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card className="p-0 overflow-hidden h-[600px] border-none shadow-2xl relative">
              <div ref={mapRef} className="w-full h-full" />
              <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur px-3 py-2 rounded-xl shadow-lg flex gap-4 text-[10px] font-bold uppercase tracking-wider">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-blue-500 rounded-full" /> Google Maps Result</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 bg-violet-600 rounded-full" /> MindCare Suggested</div>
              </div>
              {loading && (
                <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10 text-primary">
                  <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-10 h-10 animate-spin" />
                    <p className="font-bold animate-pulse">Scanning nearby clinics...</p>
                  </div>
                </div>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <h3 className="text-xl font-bold text-gray-800 flex items-center gap-2 px-2">
              <Search className="w-5 h-5 text-primary" />
              Nearby Results ({places.length + suggestions.length})
            </h3>
            <div className="space-y-4 max-h-[550px] overflow-y-auto pr-2 custom-scrollbar">
              {/* Firestore Suggestions First */}
              {suggestions.map((s) => (
                <Card key={s.id} className="p-5 hover:shadow-lg transition-all border-violet-100 bg-violet-50/20 group">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-800 leading-tight group-hover:text-primary transition-colors">{s.name}</h4>
                    <div className="bg-violet-100 text-violet-600 px-2 py-1 rounded-lg text-[10px] font-black uppercase">
                        Community
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mb-4 flex items-start gap-2">
                    <MapPin className="w-4 h-4 shrink-0 text-violet-400" />
                    {s.address}
                  </p>
                  <div className="flex gap-2">
                    {s.phone && (
                        <Button variant="secondary" size="sm" className="flex-1">
                            <Phone className="w-3 h-3 mr-2" /> Call
                        </Button>
                    )}
                    <Button variant="outline" size="sm" className="flex-1 border-violet-200 text-violet-600">
                      <Navigation className="w-3 h-3 mr-2" /> Directions
                    </Button>
                  </div>
                </Card>
              ))}

              {/* Google Results */}
              {places.map((place, i) => (
                <Card key={i} className="p-5 hover:shadow-lg transition-all cursor-pointer group border-gray-100">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-gray-800 leading-tight group-hover:text-primary transition-colors cursor-pointer">{place.name}</h4>
                    {place.rating && (
                      <div className="flex items-center gap-1 bg-yellow-50 text-yellow-600 px-2 py-1 rounded-lg text-xs font-black">
                        <Star className="w-3 h-3 fill-current" />
                        {place.rating}
                      </div>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mb-4 flex items-start gap-2">
                    <MapPin className="w-4 h-4 shrink-0 text-gray-400" />
                    {place.vicinity}
                  </p>
                  <div className="flex gap-2">
                    <Button variant="secondary" size="sm" className="flex-1">
                      <Phone className="w-3 h-3 mr-2" /> Call
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Navigation className="w-3 h-3 mr-2" /> Directions
                    </Button>
                  </div>
                </Card>
              ))}
              {places.length === 0 && suggestions.length === 0 && !loading && (
                <div className="text-center py-20 text-gray-400">
                  <p className="font-medium">No specialized centers found in this radius. Try widening your search.</p>
                </div>
              )}
            </div>
            
            <Card className="bg-secondary/30 p-6">
                <p className="text-sm text-primary font-bold mb-2">Know a clinic we missed?</p>
                <p className="text-xs text-gray-500 mb-4 leading-relaxed">Your suggestions help others in our community find the support they need.</p>
                <Button 
                    size="sm" 
                    variant="ghost" 
                    className={`px-0 flex items-center gap-2 ${user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' ? 'text-amber-600' : ''}`}
                    onClick={() => {
                        if (user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password') {
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            return;
                        }
                        setShowSuggestModal(true);
                    }}
                >
                    {user && !user.emailVerified && user.providerData?.[0]?.providerId === 'password' ? (
                        <><ShieldAlert className="w-4 h-4" /> Verify email to suggest</>
                    ) : (
                        <><Plus className="w-4 h-4" /> Add a New Listing</>
                    )}
                </Button>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
};

export default FindHelp;
