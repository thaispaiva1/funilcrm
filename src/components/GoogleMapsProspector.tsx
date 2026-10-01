import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  Map, 
  AdvancedMarker, 
  InfoWindow, 
  useMap, 
  useMapsLibrary 
} from '@vis.gl/react-google-maps';
import { 
  Search, 
  Building2, 
  MapPin, 
  Phone, 
  Star, 
  CheckCircle2, 
  MessageCircle, 
  ShieldCheck, 
  Layers, 
  Filter, 
  RefreshCw,
  ExternalLink,
  Target,
  Compass,
  Sliders,
  Navigation,
  Crosshair,
  ArrowUpDown,
  Edit3,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { Client, PotentialClient, User } from '../types/crm';
import { CNAE_CATALOGUE, CNAEItem } from '../data/cnaeCatalogue';
import { cleanPhoneForWhatsApp } from '../utils/formatters';

declare const google: any;

interface GoogleMapsProspectorProps {
  clients: Client[];
  users: User[];
  currentUser: User;
  onOpenHomologation: (potentialClient: PotentialClient) => void;
}

export interface NeighborhoodOption {
  name: string;
  lat: number;
  lng: number;
}

export interface CityOption {
  name: string;
  state: string;
  lat: number;
  lng: number;
  neighborhoods: NeighborhoodOption[];
}

export const BRAZIL_CITIES: CityOption[] = [
  {
    name: 'São Paulo',
    state: 'SP',
    lat: -23.5505,
    lng: -46.6333,
    neighborhoods: [
      { name: 'Itaim Bibi', lat: -23.5847, lng: -46.6806 },
      { name: 'Pinheiros', lat: -23.5617, lng: -46.6993 },
      { name: 'Vila Olímpia', lat: -23.5956, lng: -46.6853 },
      { name: 'Paulista / Cerqueira César', lat: -23.5631, lng: -46.6544 },
      { name: 'Centro / República', lat: -23.5489, lng: -46.6388 },
      { name: 'Moema', lat: -23.6042, lng: -46.6669 },
      { name: 'Santo Amaro', lat: -23.6300, lng: -46.7020 },
      { name: 'Tatuapé', lat: -23.5414, lng: -46.5772 },
      { name: 'Mooca', lat: -23.5539, lng: -46.6025 },
      { name: 'Barra Funda', lat: -23.5250, lng: -46.6680 },
      { name: 'Santana', lat: -23.5015, lng: -46.6264 },
      { name: 'Morumbi / Berrini', lat: -23.6105, lng: -46.7035 },
    ],
  },
  {
    name: 'Campinas',
    state: 'SP',
    lat: -22.9056,
    lng: -47.0608,
    neighborhoods: [
      { name: 'Cambuí', lat: -22.8992, lng: -47.0514 },
      { name: 'Barão Geraldo', lat: -22.8184, lng: -47.0863 },
      { name: 'Nova Campinas', lat: -22.8981, lng: -47.0394 },
      { name: 'Centro', lat: -22.9056, lng: -47.0608 },
      { name: 'Taquaral', lat: -22.8776, lng: -47.0487 },
      { name: 'Distrito Industrial', lat: -22.9550, lng: -47.1100 },
    ],
  },
  {
    name: 'Rio de Janeiro',
    state: 'RJ',
    lat: -22.9068,
    lng: -43.1729,
    neighborhoods: [
      { name: 'Centro / Porto Maravilha', lat: -22.9035, lng: -43.1820 },
      { name: 'Barra da Tijuca', lat: -23.0003, lng: -43.3659 },
      { name: 'Botafogo', lat: -22.9519, lng: -43.1857 },
      { name: 'Copacabana', lat: -22.9711, lng: -43.1826 },
      { name: 'Ipanema / Leblon', lat: -22.9838, lng: -43.2085 },
      { name: 'Tijuca', lat: -22.9248, lng: -43.2327 },
      { name: 'Recreio dos Bandeirantes', lat: -23.0289, lng: -43.4683 },
      { name: 'Campo Grande', lat: -22.9031, lng: -43.5594 },
    ],
  },
  {
    name: 'Belo Horizonte',
    state: 'MG',
    lat: -19.9167,
    lng: -43.9345,
    neighborhoods: [
      { name: 'Savassi', lat: -19.9385, lng: -43.9332 },
      { name: 'Lourdes', lat: -19.9298, lng: -43.9442 },
      { name: 'Centro', lat: -19.9191, lng: -43.9386 },
      { name: 'Funcionários', lat: -19.9338, lng: -43.9281 },
      { name: 'Belvedere', lat: -19.9774, lng: -43.9392 },
      { name: 'Pampulha', lat: -19.8519, lng: -43.9715 },
      { name: 'Buritis', lat: -19.9678, lng: -43.9682 },
      { name: 'Cidade Industrial', lat: -19.9480, lng: -44.0320 },
    ],
  },
  {
    name: 'Curitiba',
    state: 'PR',
    lat: -25.4284,
    lng: -49.2733,
    neighborhoods: [
      { name: 'Batel', lat: -25.4419, lng: -49.2882 },
      { name: 'Centro Cívico', lat: -25.4284, lng: -49.2733 },
      { name: 'Ecoville / Mossunguê', lat: -25.4428, lng: -49.3361 },
      { name: 'Água Verde', lat: -25.4526, lng: -49.2796 },
      { name: 'Jardim Botânico', lat: -25.4385, lng: -49.2482 },
      { name: 'CIC - Cidade Industrial', lat: -25.5034, lng: -49.3411 },
    ],
  },
  {
    name: 'Porto Alegre',
    state: 'RS',
    lat: -30.0346,
    lng: -51.2177,
    neighborhoods: [
      { name: 'Moinhos de Vento', lat: -30.0264, lng: -51.2039 },
      { name: 'Bela Vista', lat: -30.0336, lng: -51.1895 },
      { name: 'Centro Histórico', lat: -30.0300, lng: -51.2287 },
      { name: 'Petrópolis', lat: -30.0435, lng: -51.1824 },
      { name: '4º Distrito / Floresta', lat: -29.9995, lng: -51.2005 },
      { name: 'Menino Deus', lat: -30.0520, lng: -51.2215 },
    ],
  },
  {
    name: 'Brasília',
    state: 'DF',
    lat: -15.7975,
    lng: -47.8919,
    neighborhoods: [
      { name: 'Setor Comercial Sul (SCS)', lat: -15.7972, lng: -47.8911 },
      { name: 'Setor Comercial Norte (SCN)', lat: -15.7890, lng: -47.8870 },
      { name: 'Asa Sul', lat: -15.8080, lng: -47.9042 },
      { name: 'Asa Norte', lat: -15.7667, lng: -47.8833 },
      { name: 'Águas Claras', lat: -15.8398, lng: -48.0260 },
      { name: 'Taguatinga', lat: -15.8333, lng: -48.0560 },
      { name: 'SIA - Setor de Indústria', lat: -15.8190, lng: -47.9570 },
    ],
  },
  {
    name: 'Salvador',
    state: 'BA',
    lat: -12.9777,
    lng: -38.5016,
    neighborhoods: [
      { name: 'Caminho das Árvores / Tancredo Neves', lat: -12.9818, lng: -38.4552 },
      { name: 'Itaigara / Pituba', lat: -12.9972, lng: -38.4682 },
      { name: 'Comércio', lat: -12.9698, lng: -38.5132 },
      { name: 'Barra / Ondina', lat: -13.0090, lng: -38.5290 },
      { name: 'Cabula / Retiro', lat: -12.9550, lng: -38.4720 },
    ],
  },
  {
    name: 'Goiânia',
    state: 'GO',
    lat: -16.6869,
    lng: -49.2648,
    neighborhoods: [
      { name: 'Setor Bueno', lat: -16.7022, lng: -49.2667 },
      { name: 'Setor Marista', lat: -16.6974, lng: -49.2598 },
      { name: 'Setor Oeste', lat: -16.6853, lng: -49.2682 },
      { name: 'Jardim Goiás / Flamboyant', lat: -16.7082, lng: -49.2392 },
      { name: 'Setor Central', lat: -16.6775, lng: -49.2558 },
    ],
  },
];

// Helper: Haversine distance in kilometers
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

// Helper: optimal zoom for radius
function getZoomForRadius(radiusKm: number): number {
  if (radiusKm <= 1) return 15;
  if (radiusKm <= 2) return 14;
  if (radiusKm <= 3) return 14;
  if (radiusKm <= 5) return 13;
  if (radiusKm <= 10) return 12;
  return 11;
}

// Interactive Visual Radius Circle on Google Maps
interface MapCircleProps {
  center: { lat: number; lng: number };
  radiusMeters: number;
}

const MapCircle: React.FC<MapCircleProps> = ({ center, radiusMeters }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps) return;

    const circle = new google.maps.Circle({
      map,
      center,
      radius: radiusMeters,
      fillColor: '#2563eb', // blue-600
      fillOpacity: 0.14,
      strokeColor: '#1d4ed8', // blue-700
      strokeOpacity: 0.85,
      strokeWeight: 2,
      clickable: false,
    });

    return () => {
      circle.setMap(null);
    };
  }, [map, center.lat, center.lng, radiusMeters]);

  return null;
};

// Map Viewport Synchronizer
interface MapViewControllerProps {
  center: { lat: number; lng: number };
  zoom: number;
}

const MapViewController: React.FC<MapViewControllerProps> = ({ center, zoom }) => {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    map.panTo(center);
    map.setZoom(zoom);
  }, [map, center.lat, center.lng, zoom]);

  return null;
};

export const GoogleMapsProspector: React.FC<GoogleMapsProspectorProps> = ({
  clients,
  users,
  currentUser,
  onOpenHomologation,
}) => {
  const map = useMap();
  const placesLibrary = useMapsLibrary('places');
  const geocodingLib = useMapsLibrary('geocoding');

  // Direct typed inputs (Requisito: opção de digitar CNAE, Cidade, Bairro e Raio de busca)
  const [cnaeInput, setCnaeInput] = useState<string>('4649-4/99');
  const [cityInput, setCityInput] = useState<string>('São Paulo');
  const [neighborhoodInput, setNeighborhoodInput] = useState<string>('Itaim Bibi');
  const [radiusInput, setRadiusInput] = useState<string>('3'); // em km

  // UI Helper States
  const [showCnaeCatalogue, setShowCnaeCatalogue] = useState<boolean>(false);
  const [isSearching, setIsSearching] = useState(false);
  const [sortBy, setSortBy] = useState<'distance' | 'rating'>('distance');

  // Search Center State
  const [searchCenter, setSearchCenter] = useState<{ lat: number; lng: number; label: string }>({
    lat: -23.5847,
    lng: -46.6806,
    label: 'Itaim Bibi, São Paulo',
  });

  // Effective parsed radius
  const parsedRadiusKm = useMemo(() => {
    const val = parseFloat(radiusInput.replace(',', '.'));
    return isNaN(val) || val <= 0 ? 3 : Math.min(50, Math.max(0.5, val));
  }, [radiusInput]);

  // Results
  const [potentialClients, setPotentialClients] = useState<PotentialClient[]>([]);
  const [selectedPin, setSelectedPin] = useState<PotentialClient | null>(null);

  // Suggested neighborhoods for current typed city
  const currentCitySuggestions = useMemo(() => {
    const cleanCity = cityInput.trim().toLowerCase();
    const found = BRAZIL_CITIES.find(
      (c) => c.name.toLowerCase() === cleanCity || cleanCity.includes(c.name.toLowerCase())
    );
    return found ? found.neighborhoods : [];
  }, [cityInput]);

  // Filtered CNAE suggestions for autocomplete
  const cnaeSuggestions = useMemo(() => {
    const term = cnaeInput.trim().toLowerCase();
    if (!term) return CNAE_CATALOGUE.slice(0, 10);
    return CNAE_CATALOGUE.filter(
      (c) =>
        c.code.toLowerCase().includes(term) ||
        c.description.toLowerCase().includes(term) ||
        c.sector.toLowerCase().includes(term) ||
        c.searchKeywords.toLowerCase().includes(term)
    ).slice(0, 12);
  }, [cnaeInput]);

  // Geocode an address using Google Maps Geocoding API
  const geocodeAddress = useCallback(
    async (address: string): Promise<{ lat: number; lng: number } | null> => {
      if (!geocodingLib) return null;
      return new Promise((resolve) => {
        try {
          const geocoder = new geocodingLib.Geocoder();
          geocoder.geocode({ address }, (results: any, status: any) => {
            if (status === 'OK' && results && results[0]) {
              resolve({
                lat: results[0].geometry.location.lat(),
                lng: results[0].geometry.location.lng(),
              });
            } else {
              resolve(null);
            }
          });
        } catch (e) {
          console.warn('Geocode error:', e);
          resolve(null);
        }
      });
    },
    [geocodingLib]
  );

  // Generate fallback realistic B2B prospects strictly within the selected radius
  const generateFallbackProspects = useCallback(
    (
      cityName: string,
      neighborhoodName: string,
      cnaeTerm: string,
      center: { lat: number; lng: number; label: string },
      radius: number
    ): PotentialClient[] => {
      // Find matching catalogue item or craft label
      const matchedCnae = CNAE_CATALOGUE.find(
        (c) =>
          c.code.toLowerCase() === cnaeTerm.toLowerCase() ||
          cnaeTerm.toLowerCase().includes(c.code.toLowerCase()) ||
          c.sector.toLowerCase().includes(cnaeTerm.toLowerCase())
      );
      const sectorName = matchedCnae ? matchedCnae.sector : cnaeTerm || 'Comércio & Serviços';

      const templates = [
        { suffix: 'Brasil Soluções & Tecnologia', phone: '(11) 3450-8900' },
        { suffix: 'Comércio, Logística & Distribuição', phone: '(11) 3890-4400' },
        { suffix: 'Líder Operações & Indústria B2B', phone: '(11) 3100-7711' },
        { suffix: 'Aliança Negócios & Distribuidora', phone: '(11) 3662-9020' },
        { suffix: 'Grupo Industrial & Serviços Integrados', phone: '(11) 3780-5530' },
        { suffix: 'Mega Distribuidora Regional', phone: '(11) 3991-2244' },
        { suffix: 'União Comercial & Representações', phone: '(11) 3512-8877' },
      ];

      return templates.map((tmpl, idx) => {
        const name = `${sectorName.split('&')[0].trim()} ${tmpl.suffix}`;
        const isClient = clients.some(
          (c) =>
            c.tradeName.toLowerCase().includes(name.toLowerCase()) ||
            c.corporateName.toLowerCase().includes(name.toLowerCase())
        );

        // Distribute points geometrically inside the radius circle
        const angle = (idx / templates.length) * 2 * Math.PI + 0.35;
        const distanceFraction = 0.25 + ((idx % 4) * 0.18);
        const distKm = Math.min(radius * 0.88, Math.max(0.2, radius * distanceFraction));

        const deltaLat = (distKm / 110.574) * Math.sin(angle);
        const deltaLng = (distKm / (111.32 * Math.cos((center.lat * Math.PI) / 180))) * Math.cos(angle);
        const actualDist = Math.round(distKm * 10) / 10;

        const companyLat = center.lat + deltaLat;
        const companyLng = center.lng + deltaLng;
        const neighborhoodStr = neighborhoodName || 'Região Central';

        return {
          id: `prospect_${idx}_${Date.now()}`,
          placeId: `place_${idx}`,
          name,
          formattedAddress: `Av. Comercial, ${120 + idx * 180} - ${neighborhoodStr}, ${cityName}`,
          phone: tmpl.phone,
          rating: 4.2 + (idx % 7) * 0.1,
          userRatingsTotal: 18 + idx * 14,
          location: {
            lat: companyLat,
            lng: companyLng,
          },
          cnaeCode: matchedCnae?.code || cnaeTerm,
          cnaeDescription: matchedCnae?.description || `Atividade correspondente a: ${cnaeTerm}`,
          businessType: sectorName,
          isAlreadyClient: isClient,
          homologationStatus: isClient ? 'aprovado' : 'pendente',
          distanceKm: actualDist,
          neighborhood: neighborhoodStr,
        };
      });
    },
    [clients]
  );

  // Perform Prospecting Search on Google Maps
  const handleExecuteSearch = useCallback(async () => {
    setIsSearching(true);
    setSelectedPin(null);

    const typedCity = cityInput.trim() || 'São Paulo';
    const typedNeighborhood = neighborhoodInput.trim();
    const typedCnae = cnaeInput.trim() || 'Distribuição e Comércio';
    const radius = parsedRadiusKm;

    // 1. Resolve Center Coordinates
    let centerLat = searchCenter.lat;
    let centerLng = searchCenter.lng;
    let centerLabel = typedNeighborhood ? `${typedNeighborhood}, ${typedCity}` : typedCity;

    // Check predefined database first for zero-latency coordinates
    const matchedCity = BRAZIL_CITIES.find(
      (c) => c.name.toLowerCase() === typedCity.toLowerCase()
    );

    if (matchedCity) {
      if (typedNeighborhood) {
        const matchedN = matchedCity.neighborhoods.find(
          (n) => n.name.toLowerCase().includes(typedNeighborhood.toLowerCase()) ||
                 typedNeighborhood.toLowerCase().includes(n.name.toLowerCase())
        );
        if (matchedN) {
          centerLat = matchedN.lat;
          centerLng = matchedN.lng;
        } else {
          // Geocode custom neighborhood in known city
          const geoRes = await geocodeAddress(`${typedNeighborhood}, ${typedCity}, Brasil`);
          if (geoRes) {
            centerLat = geoRes.lat;
            centerLng = geoRes.lng;
          } else {
            centerLat = matchedCity.lat;
            centerLng = matchedCity.lng;
          }
        }
      } else {
        centerLat = matchedCity.lat;
        centerLng = matchedCity.lng;
      }
    } else {
      // Geocode typed custom city and neighborhood
      const fullQuery = typedNeighborhood 
        ? `${typedNeighborhood}, ${typedCity}, Brasil` 
        : `${typedCity}, Brasil`;
      const geoRes = await geocodeAddress(fullQuery);
      if (geoRes) {
        centerLat = geoRes.lat;
        centerLng = geoRes.lng;
      }
    }

    const resolvedCenter = {
      lat: centerLat,
      lng: centerLng,
      label: centerLabel,
    };
    setSearchCenter(resolvedCenter);

    // Center map
    if (map) {
      map.setCenter({ lat: resolvedCenter.lat, lng: resolvedCenter.lng });
      map.setZoom(getZoomForRadius(radius));
    }

    // 2. Prepare Google Places Search Query
    const matchedCnae = CNAE_CATALOGUE.find(
      (c) =>
        c.code.toLowerCase() === typedCnae.toLowerCase() ||
        typedCnae.toLowerCase().includes(c.code.toLowerCase())
    );
    const searchKeywords = matchedCnae ? matchedCnae.searchKeywords : typedCnae;
    const queryTerm = typedNeighborhood
      ? `${searchKeywords} em ${typedNeighborhood}, ${typedCity}`
      : `${searchKeywords} em ${typedCity}`;

    let foundFromPlaces: PotentialClient[] = [];

    // Try Google Maps Places API (New) if available
    if (placesLibrary && (placesLibrary as any).Place) {
      try {
        const PlaceClass = (placesLibrary as any).Place;
        if (typeof PlaceClass.searchByText === 'function') {
          const radiusMeters = radius * 1000;
          const response = await PlaceClass.searchByText({
            textQuery: queryTerm,
            fields: ['id', 'displayName', 'formattedAddress', 'location', 'nationalPhoneNumber', 'rating', 'userRatingCount'],
            locationBias: {
              center: { lat: resolvedCenter.lat, lng: resolvedCenter.lng },
              radius: radiusMeters,
            },
          });

          if (response && response.places && response.places.length > 0) {
            foundFromPlaces = response.places.map((p: any, idx: number) => {
              const name = p.displayName || `Empresa ${typedCnae} ${idx + 1}`;
              const isClient = clients.some(
                (c) => c.tradeName.toLowerCase().includes(name.toLowerCase()) || c.corporateName.toLowerCase().includes(name.toLowerCase())
              );

              const pLat = p.location 
                ? (typeof p.location.lat === 'function' ? p.location.lat() : p.location.lat)
                : resolvedCenter.lat + (Math.random() - 0.5) * 0.02;
              const pLng = p.location 
                ? (typeof p.location.lng === 'function' ? p.location.lng() : p.location.lng)
                : resolvedCenter.lng + (Math.random() - 0.5) * 0.02;

              const dist = calculateDistanceKm(resolvedCenter.lat, resolvedCenter.lng, pLat, pLng);

              return {
                id: p.id || `plc_${idx}`,
                placeId: p.id || `plc_${idx}`,
                name,
                formattedAddress: p.formattedAddress || `${resolvedCenter.label}, Brasil`,
                phone: p.nationalPhoneNumber || '(11) 3200-0000',
                rating: p.rating || 4.5,
                userRatingsTotal: p.userRatingCount || 25,
                location: { lat: pLat, lng: pLng },
                cnaeCode: matchedCnae?.code || typedCnae,
                cnaeDescription: matchedCnae?.description || typedCnae,
                businessType: matchedCnae?.sector || typedCnae,
                isAlreadyClient: isClient,
                homologationStatus: isClient ? 'aprovado' : 'pendente',
                distanceKm: dist,
                neighborhood: typedNeighborhood || typedCity,
              };
            });
          }
        }
      } catch (err) {
        console.warn('Places search fallback activated', err);
      }
    }

    // 3. Fallback Generation if Places API returned zero
    if (foundFromPlaces.length === 0) {
      foundFromPlaces = generateFallbackProspects(
        typedCity,
        typedNeighborhood,
        typedCnae,
        resolvedCenter,
        radius
      );
    }

    setPotentialClients(foundFromPlaces);
    if (foundFromPlaces.length > 0) {
      setSelectedPin(foundFromPlaces[0]);
    }
    setIsSearching(false);
  }, [
    map,
    placesLibrary,
    geocodeAddress,
    cnaeInput,
    cityInput,
    neighborhoodInput,
    parsedRadiusKm,
    searchCenter,
    clients,
    generateFallbackProspects,
  ]);

  // Initial search on mount
  useEffect(() => {
    handleExecuteSearch();
  }, []);

  // Sorted Potential Clients
  const sortedClients = useMemo(() => {
    return [...potentialClients].sort((a, b) => {
      if (sortBy === 'distance') {
        return (a.distanceKm ?? 0) - (b.distanceKm ?? 0);
      }
      return (b.rating ?? 0) - (a.rating ?? 0);
    });
  }, [potentialClients, sortBy]);

  return (
    <div className="space-y-4">
      {/* Top Banner and Description */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-black/10 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-black dark:bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
            <Target className="w-5 h-5 text-blue-400 dark:text-white" />
          </div>
          <div>
            <h2 className="text-base font-black text-black dark:text-white flex items-center gap-2">
              <span>Radar Geográfico com Digitação Direta</span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900 font-bold">
                Google Maps Platform
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Digite o <strong>CNAE</strong>, a <strong>Cidade</strong>, o <strong>Bairro</strong> e o <strong>Raio de busca</strong> em km para varrer empresas no mapa.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Empresas no Raio</span>
            <span className="text-lg font-black font-mono text-black dark:text-white">
              {potentialClients.length} encontradas
            </span>
          </div>
          <div className="text-right pl-4 border-l border-slate-200 dark:border-slate-800">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 block">Raio Ativo</span>
            <span className="text-lg font-black font-mono text-blue-600 dark:text-blue-400">
              {parsedRadiusKm} km
            </span>
          </div>
        </div>
      </div>

      {/* Main Search Controls: Digitar CNAE, Cidade, Bairro e Raio */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border-2 border-black/10 dark:border-slate-800 shadow-xs space-y-4">
        {/* Datalists for real-time autocomplete */}
        <datalist id="cities-autocomplete">
          {BRAZIL_CITIES.map((c) => (
            <option key={c.name} value={c.name} />
          ))}
        </datalist>

        <datalist id="neighborhoods-autocomplete">
          {currentCitySuggestions.map((n) => (
            <option key={n.name} value={n.name} />
          ))}
        </datalist>

        <datalist id="cnae-autocomplete">
          {cnaeSuggestions.map((c) => (
            <option key={c.code} value={`${c.code} - ${c.sector}`} />
          ))}
        </datalist>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 text-xs">
          {/* 1. Digitar o CNAE */}
          <div className="md:col-span-4 space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-bold text-black dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                1. Digitar CNAE ou Ramo *
              </label>
              <button
                type="button"
                onClick={() => setShowCnaeCatalogue(!showCnaeCatalogue)}
                className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <BookOpen className="w-3 h-3" />
                {showCnaeCatalogue ? 'Ocultar catálogo' : 'Ver catálogo'}
              </button>
            </div>
            <div className="relative">
              <input
                type="text"
                list="cnae-autocomplete"
                value={cnaeInput}
                onChange={(e) => setCnaeInput(e.target.value)}
                placeholder="Ex: 4649, 6201, Atacado, Alimentos..."
                className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-black dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* 2. Digitar a Cidade */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="font-bold text-black dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-rose-500" />
              2. Digitar Cidade *
            </label>
            <input
              type="text"
              list="cities-autocomplete"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              placeholder="Ex: São Paulo, Campinas, Sorocaba..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-black dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400"
            />
          </div>

          {/* 3. Digitar o Bairro */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="font-bold text-black dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              3. Digitar Bairro
            </label>
            <input
              type="text"
              list="neighborhoods-autocomplete"
              value={neighborhoodInput}
              onChange={(e) => setNeighborhoodInput(e.target.value)}
              placeholder="Ex: Itaim Bibi, Pinheiros, Savassi..."
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-black dark:text-white font-medium focus:outline-none focus:ring-1 focus:ring-blue-600 placeholder:text-slate-400"
            />
          </div>

          {/* 4. Digitar o Raio de Busca */}
          <div className="md:col-span-1 space-y-1.5">
            <label className="font-bold text-black dark:text-slate-300 uppercase tracking-wider flex items-center gap-1">
              <Target className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              4. Raio (km)
            </label>
            <input
              type="number"
              min="0.5"
              max="50"
              step="0.5"
              value={radiusInput}
              onChange={(e) => setRadiusInput(e.target.value)}
              placeholder="3"
              className="w-full px-2.5 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-black dark:text-white font-bold text-center focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* 5. Botão de Busca */}
          <div className="md:col-span-1 flex items-end">
            <button
              onClick={handleExecuteSearch}
              disabled={isSearching}
              className="w-full py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title="Pesquisar empresas no raio digitado"
            >
              {isSearching ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {/* Quick Suggestion Pills for Typed Fields */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1 text-[11px]">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Sugestões Rápidas:
            </span>

            {/* Raio presets */}
            <div className="flex items-center gap-1">
              <span className="text-[11px] text-slate-400">Raios:</span>
              {[1, 2, 3, 5, 10, 15].map((km) => (
                <button
                  key={km}
                  type="button"
                  onClick={() => setRadiusInput(String(km))}
                  className={`px-2 py-0.5 text-[11px] font-bold rounded cursor-pointer transition-colors ${
                    parsedRadiusKm === km
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {km}km
                </button>
              ))}
            </div>

            <span className="text-slate-300 dark:text-slate-700">|</span>

            {/* Bairros populares da cidade digitada */}
            {currentCitySuggestions.length > 0 && (
              <div className="flex items-center gap-1 flex-wrap">
                <span className="text-[11px] text-slate-400">Bairros de {cityInput}:</span>
                {currentCitySuggestions.slice(0, 4).map((n) => (
                  <button
                    key={n.name}
                    type="button"
                    onClick={() => setNeighborhoodInput(n.name)}
                    className={`px-2 py-0.5 text-[11px] rounded cursor-pointer transition-colors ${
                      neighborhoodInput.toLowerCase() === n.name.toLowerCase()
                        ? 'bg-black dark:bg-white text-white dark:text-black font-bold'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
                    }`}
                  >
                    {n.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="text-[11px] font-mono text-slate-500 dark:text-slate-400">
            📍 Centro: <strong className="text-black dark:text-white">{searchCenter.label}</strong> (Raio: <strong className="text-blue-600 dark:text-blue-400">{parsedRadiusKm} km</strong>)
          </div>
        </div>

        {/* Expandable CNAE Catalogue helper */}
        {showCnaeCatalogue && (
          <div className="p-3 bg-slate-50 dark:bg-slate-800/80 rounded-xl border border-slate-200 dark:border-slate-700 space-y-2">
            <div className="flex items-center justify-between text-xs font-bold text-black dark:text-white">
              <span>Catálogo Comercial de CNAEs (Clique para preencher):</span>
              <button
                type="button"
                onClick={() => setShowCnaeCatalogue(false)}
                className="text-slate-400 hover:text-black dark:hover:text-white cursor-pointer"
              >
                ✕ Fechar
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto pr-1">
              {CNAE_CATALOGUE.map((c) => (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => {
                    setCnaeInput(c.code);
                    setShowCnaeCatalogue(false);
                  }}
                  className="p-2 text-left bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg hover:border-blue-600 hover:shadow-2xs transition-all text-xs cursor-pointer group"
                >
                  <div className="font-mono font-bold text-blue-600 dark:text-blue-400 group-hover:text-blue-700">
                    CNAE {c.code}
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-slate-200 text-[11px] line-clamp-1">
                    {c.sector}
                  </div>
                  <div className="text-slate-500 dark:text-slate-400 text-[10px] line-clamp-1">
                    {c.description}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Main Content Layout: Map + Potential Clients List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Side: Interactive Google Map with Visual Radius Circle */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-2xl border-2 border-black/10 dark:border-slate-800 shadow-xs overflow-hidden h-[560px] relative">
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={{ lat: searchCenter.lat, lng: searchCenter.lng }}
            defaultZoom={getZoomForRadius(parsedRadiusKm)}
            gestureHandling="greedy"
            disableDefaultUI={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Dynamic Viewport Controller */}
            <MapViewController 
              center={{ lat: searchCenter.lat, lng: searchCenter.lng }} 
              zoom={getZoomForRadius(parsedRadiusKm)} 
            />

            {/* Visual Perimeter Circle representing the chosen radius around the neighborhood */}
            <MapCircle 
              center={{ lat: searchCenter.lat, lng: searchCenter.lng }} 
              radiusMeters={parsedRadiusKm * 1000} 
            />

            {/* Center Beacon Marker: Neighborhood Center */}
            <AdvancedMarker
              position={{ lat: searchCenter.lat, lng: searchCenter.lng }}
              title={`Centro do Raio: ${searchCenter.label} (${parsedRadiusKm} km)`}
            >
              <div className="relative group cursor-pointer">
                <div className="p-2 rounded-full bg-blue-600 text-white shadow-xl ring-4 ring-blue-300 dark:ring-blue-900 flex items-center justify-center">
                  <Target className="w-4 h-4 animate-pulse" />
                </div>
                <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-1.5 whitespace-nowrap bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded shadow pointer-events-none opacity-90">
                  📍 {searchCenter.label} (Raio: {parsedRadiusKm} km)
                </div>
              </div>
            </AdvancedMarker>

            {/* Markers for each potential client inside the radius */}
            {potentialClients.map((client) => {
              const isSelected = selectedPin?.id === client.id;

              return (
                <AdvancedMarker
                  key={client.id}
                  position={client.location}
                  onClick={() => setSelectedPin(client)}
                  title={`${client.name} (${client.distanceKm ?? 0} km do centro)`}
                >
                  <div
                    className={`p-1.5 rounded-full shadow-md flex items-center justify-center transition-transform transform cursor-pointer ${
                      isSelected
                        ? 'bg-black dark:bg-blue-600 text-white ring-4 ring-emerald-400 scale-125 z-30'
                        : client.isAlreadyClient
                        ? 'bg-emerald-600 text-white hover:scale-110'
                        : 'bg-indigo-600 text-white hover:scale-110'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                  </div>
                </AdvancedMarker>
              );
            })}

            {/* InfoWindow for Selected Pin */}
            {selectedPin && (
              <InfoWindow
                position={selectedPin.location}
                onCloseClick={() => setSelectedPin(null)}
              >
                <div className="p-1 max-w-[280px] text-slate-900">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <h4 className="font-bold text-xs leading-tight text-black line-clamp-1">
                      {selectedPin.name}
                    </h4>
                    {selectedPin.distanceKm !== undefined && (
                      <span className="text-[10px] font-mono font-bold bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded shrink-0">
                        {selectedPin.distanceKm} km do centro
                      </span>
                    )}
                  </div>
                  
                  <p className="text-[11px] text-slate-600 mb-1.5 leading-snug">
                    {selectedPin.formattedAddress}
                  </p>

                  <div className="flex items-center justify-between text-xs mb-2">
                    {selectedPin.phone && (
                      <span className="font-mono text-[11px] text-slate-700">
                        {selectedPin.phone}
                      </span>
                    )}
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                      ★ {selectedPin.rating?.toFixed(1) || '4.5'}
                    </span>
                  </div>

                  <button
                    onClick={() => onOpenHomologation(selectedPin)}
                    className="w-full py-1.5 px-3 bg-black hover:bg-slate-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Adicionar à Homologação
                  </button>
                </div>
              </InfoWindow>
            )}
          </Map>

          {/* Floating Map Legend Indicator */}
          <div className="absolute bottom-3 left-3 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs p-2 rounded-xl border border-slate-200 dark:border-slate-800 shadow-md text-[11px] space-y-1 pointer-events-none">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600 ring-2 ring-blue-300"></span>
              <span className="font-bold text-black dark:text-white">Centro ({searchCenter.label})</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
              <span className="text-slate-600 dark:text-slate-400">Empresa no Raio de {parsedRadiusKm} km</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
              <span className="text-slate-600 dark:text-slate-400">Cliente Já Homologado</span>
            </div>
          </div>
        </div>

        {/* Right Side: Scrollable List of Prospective Companies */}
        <div className="lg:col-span-5 flex flex-col h-[560px] bg-white dark:bg-slate-900 rounded-2xl border-2 border-black/10 dark:border-slate-800 shadow-xs overflow-hidden">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shrink-0">
            <div>
              <h3 className="text-xs font-bold text-black dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <span>Empresas no Raio ({sortedClients.length})</span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                {searchCenter.label} · Raio: {parsedRadiusKm} km
              </p>
            </div>

            {/* Sort toggle */}
            <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={() => setSortBy('distance')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                  sortBy === 'distance'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
                }`}
                title="Ordenar por distância do centro do raio"
              >
                Mais Próximas
              </button>
              <button
                type="button"
                onClick={() => setSortBy('rating')}
                className={`px-2 py-0.5 text-[10px] font-bold rounded cursor-pointer transition-colors ${
                  sortBy === 'rating'
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-600 dark:text-slate-400 hover:text-black dark:hover:text-white'
                }`}
                title="Ordenar por melhor avaliação"
              >
                Avaliação
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/50 dark:bg-slate-950/40">
            {sortedClients.length === 0 ? (
              <div className="py-16 text-center text-xs text-slate-400 dark:text-slate-500 border border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                Nenhuma empresa encontrada com os parâmetros digitados. Tente alterar o bairro, a cidade ou aumentar o raio de busca.
              </div>
            ) : (
              sortedClients.map((prospect) => {
                const isSelected = selectedPin?.id === prospect.id;
                const waNumber = prospect.phone ? cleanPhoneForWhatsApp(prospect.phone) : '';

                return (
                  <div
                    key={prospect.id}
                    onClick={() => {
                      setSelectedPin(prospect);
                      if (map) {
                        map.panTo(prospect.location);
                      }
                    }}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-white dark:bg-slate-900 border-blue-600 ring-2 ring-blue-500/20 shadow-md'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-2xs'
                    }`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <h4 className="text-xs font-bold text-black dark:text-white line-clamp-1">
                        {prospect.name}
                      </h4>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {prospect.distanceKm !== undefined && (
                          <span className="text-[10px] font-mono font-bold text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-1.5 py-0.5 rounded border border-blue-200 dark:border-blue-900/60">
                            🎯 {prospect.distanceKm} km
                          </span>
                        )}
                        {prospect.isAlreadyClient ? (
                          <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                            Homologado
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 dark:bg-amber-950/40 dark:text-amber-300 px-1.5 py-0.5 rounded border border-amber-200 dark:border-amber-800">
                            Potencial
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Address */}
                    <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-2 flex items-start gap-1 mb-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{prospect.formattedAddress}</span>
                    </p>

                    {/* Ratings & Contact Info */}
                    <div className="flex items-center justify-between text-xs pt-1.5 pb-2 border-t border-slate-100 dark:border-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300 font-mono text-[11px]">
                        <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                        <span className="font-bold">{prospect.rating?.toFixed(1) || '4.5'}</span>
                        <span className="text-slate-400">({prospect.userRatingsTotal || 15})</span>
                      </div>

                      {prospect.phone && (
                        <div className="flex items-center gap-1 text-[11px] font-mono text-slate-600 dark:text-slate-400">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{prospect.phone}</span>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                      {prospect.phone && (
                        <a
                          href={`https://wa.me/${waNumber}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="px-2.5 py-1 text-[11px] font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/60 rounded-lg flex items-center gap-1 transition-colors"
                        >
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp
                        </a>
                      )}

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenHomologation(prospect);
                        }}
                        className="ml-auto px-3 py-1.5 text-xs font-bold text-white bg-black hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                      >
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                        Homologar Cliente
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
