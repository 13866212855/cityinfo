import React, { useEffect, useRef } from 'react';

// Declare global Leaflet object from CDN
declare const L: any;

interface MapViewerProps {
    lat: number;
    lng: number;
    title?: string;
    onClose: () => void;
}

const MapViewer: React.FC<MapViewerProps> = ({ lat, lng, title, onClose }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapInstanceRef = useRef<any>(null);

    useEffect(() => {
        if (!mapContainerRef.current) return;
        
        // Prevent re-initialization
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
        }

        try {
            // Initialize map
            // Use a slight timeout to ensure container is ready in DOM
            setTimeout(() => {
                if (!mapContainerRef.current) return;
                
                const map = L.map(mapContainerRef.current).setView([lat, lng], 15);
                mapInstanceRef.current = map;

                // Add OpenStreetMap tiles
                L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '&copy; OpenStreetMap contributors'
                }).addTo(map);

                // Add marker
                L.marker([lat, lng]).addTo(map)
                    .bindPopup(title || '位置')
                    .openPopup();
                
                // Force invalidate size to handle modal rendering issues
                map.invalidateSize();
            }, 100);

        } catch (e) {
            console.error("Error initializing map:", e);
        }

        // Cleanup
        return () => {
            if (mapInstanceRef.current) {
                mapInstanceRef.current.remove();
                mapInstanceRef.current = null;
            }
        };
    }, [lat, lng, title]);

    return (
        <div className="fixed inset-0 z-[60] bg-white flex flex-col">
            <div className="flex items-center justify-between p-4 border-b shadow-sm bg-white z-10">
                <h2 className="font-bold text-gray-800">位置详情</h2>
                <button onClick={onClose} className="w-8 h-8 flex items-center justify-center bg-gray-100 rounded-full active:bg-gray-200">
                    <i className="fa-solid fa-xmark text-lg"></i>
                </button>
            </div>
            <div className="relative flex-1 w-full bg-gray-100">
                <div ref={mapContainerRef} className="absolute inset-0 z-0" />
                {/* Overlay Controls if needed */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[400] bg-white px-4 py-2 rounded-full shadow-lg text-sm font-medium text-gray-700 pointer-events-none">
                    <i className="fa-solid fa-location-dot text-red-500 mr-2"></i>
                    {title || '目标位置'}
                </div>
            </div>
        </div>
    );
};

export default MapViewer;