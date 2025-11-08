import React, {useEffect, useState} from "react";
import loadGeoJSON from "@/shared/api/loadGeoJSON";
import {MapView} from "@/features/geo-display/MapView";
import {LatLngExpression} from "leaflet";
import 'leaflet/dist/leaflet.css';
import {getSegmentLib} from "@/features/route-intersections/getSegmentLib";
import {parseGeoJSONRoutes} from "@/entities/geo-data/convertor";

const ekb = [56.838011, 60.597474] as LatLngExpression;
declare global {
    interface Window {
        setShowRoutes: React.Dispatch<React.SetStateAction<IRoute[]>>;
    }
}
const segmentLib = getSegmentLib();

export default function MapWidget() {
    const [allRoutes, setAllRoutes] = useState<IRoute[]>([]);
    const [selectedRoutes, setSelectedRoutes] = useState<IRoute[]>([]);
    const [visibleGroups, setVisibleGroups] = useState<Set<string>>(new Set());
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const [selectedFile, setSelectedFile] = useState<string>("/routes_with_segment_refs.geo.json");
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

// eslint-disable-next-line
    const [uploadedGeoJSON, setSelectedGeoJSON] = useState<any | null>(null);

    useEffect(() => {
        const f = async () => {
            let geo;
            if (uploadedGeoJSON) {
                geo = uploadedGeoJSON;
            } else {
                geo = await loadGeoJSON(selectedFile);
            }
            setAllRoutes(geo);
            setSelectedRoutes(geo);
            // Initialize all groups as visible
            const types = new Set(geo.map((r: IRoute) => r.transport_type));
            setVisibleGroups(types);
            // setConflicts(_conflicts);
        };
        f();
    }, [selectedFile, uploadedGeoJSON]);


    useEffect(() => {
        const f = async () => {
            const geoJSON = await loadGeoJSON(selectedFile);
            // const geoJSON = await loadGeoJSON("/test_routes.geo.json");
            // const _conflicts = detector(geoJSON)
            setAllRoutes(geoJSON);
            setSelectedRoutes(geoJSON);
            const types = new Set(geoJSON.map((r: IRoute) => r.transport_type));
            setVisibleGroups(types);
            //setConflicts(_conflicts);
        }
        f()
    }, [selectedFile]);

    // Compute visible routes based on selected routes and visible groups
    const showRoutes = selectedRoutes.filter(route =>
        visibleGroups.has(route.transport_type)
    );

    useEffect(() => {
        window.setShowRoutes = setSelectedRoutes;
    }, []);

    useEffect(() => {
        console.log(showRoutes);
    }, [showRoutes]);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const fileName = e.target.value;
        // setSelectedFile(fileName);
        // Передаём путь к файлу (с добавлением слеша для корректного запроса)
        setSelectedFile(fileName);
        console.log(fileName);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            try {
                const geo = JSON.parse(reader.result as string);
                const g = parseGeoJSONRoutes(geo);
                setSelectedGeoJSON(g);
            } catch {
                alert("Неверный формат JSON");
            }
        };
        reader.readAsText(file);
    };

    interface GeoFile {
        name: string;
        file: string;
    }

    const toggleRoute = (route: IRoute) => {
        setSelectedRoutes(prev =>
            prev.find(r => r.name === route.name)
                ? prev.filter(r => r.name !== route.name)
                : [...prev, route]
        );
    };

    const transportTypes = Array.from(
        new Set(allRoutes.map(r => r.transport_type))
    );

    const toggleGroup = (type: string) => {
        setExpandedGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(type)) {
                newSet.delete(type);
            } else {
                newSet.add(type);
            }
            return newSet;
        });
    };

    const toggleGroupVisibility = (type: string) => {
        setVisibleGroups(prev => {
            const newSet = new Set(prev);
            if (newSet.has(type)) {
                newSet.delete(type);
            } else {
                newSet.add(type);
            }
            return newSet;
        });
    };

    const selectAllInGroup = (type: string) => {
        const routesInGroup = groupedRoutes[type] || [];
        const routesToAdd = routesInGroup.filter(route =>
            !selectedRoutes.some(r => r.name === route.name)
        );
        if (routesToAdd.length > 0) {
            setSelectedRoutes(prev => [...prev, ...routesToAdd]);
        }
    };

    // Group routes by transport type
    const groupedRoutes = transportTypes.reduce((acc, type) => {
        acc[type] = allRoutes.filter(r => r.transport_type === type);
        return acc;
    }, {} as Record<string, IRoute[]>);


    function toRad(deg: number): number {
        return (deg * Math.PI) / 180;
    }

// Расстояние между двумя точками [lat, lng] в километрах
    function getDistanceHaversine(p1: IPoint, p2: IPoint): number {
        const R = 6371; // Радиус Земли в км
        const [lat1, lng1] = p1;
        const [lat2, lng2] = p2;

        const dLat = toRad(lat2 - lat1);
        const dLng = toRad(lng2 - lng1);
        const a =
            Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

        return R * c;
    }

// Сумма длин пар точек в одном сегменте
    function getSegmentLength(segment: IPoint[]): number {
        let lengthKm = 0;
        for (let i = 1; i < segment.length; i++) {
            lengthKm += getDistanceHaversine(
                segment[i - 1] as IPoint,
                segment[i] as IPoint
            );
        }
        return lengthKm;
    }


// Основная функция
    function calculateRouteLength(
        route: IRoute,
        segmentLib: ISegmentLib
    ): number {
        const totalKm = route.segments.reduce((sum, segRef) => {
            const seg = segmentLib.get(segRef.segment_id);
            if (!seg) return sum;
            return sum + getSegmentLength(seg);
        }, 0);

        // округляем до сотых километра
        return Math.round(totalKm * 100) / 100;
    }


// Список доступных geojson-файлов
    const geoJsonFiles: GeoFile[] = [
        {name: 'Scheme 1', file: '/routes_with_segment_refs.geo.json'},
        {name: 'Scheme 2 (without 68)', file: '/test_routes2_with_ids.geo.json'},
        {name: 'Все маршруты - текущая', file: '/all_routes_current_with_ids.geo.json'},
        {name: 'Трамваи - предлагаемая', file: '/tram_new_with_ids.geo.json'},
        {name: 'Трамваи - текущая', file: '/tram_current_with_ids.geo.json'},
        {name: 'Трамваи - инерционная', file: '/tram_inner_with_ids.geo.json'},
    ];

    const transports: Record<string, string> = {
        'troll': 'Троллейбус',
        'bus': 'Автобус',
        'tram': 'Трамвай',
        'metro': 'Метро'
    }

    return (
        <div className="relative">
            {!isMenuOpen && (
                <button
                    className="fixed bottom-4 left-4 bg-white px-3 py-2 rounded-r shadow hover:bg-gray-50 z-1000"
                    onClick={() => setIsMenuOpen(true)}
                >
                    {">"}
                </button>
            )}
            {isMenuOpen && (
                <div className="absolute top-0 left-0 w-1/4 h-full bg-gray-100 p-4 shadow overflow-y-auto z-1000">
                    {/* Схема с селектором и кнопкой "показать все" */}
                    <div className="mb-4 bg-white rounded-lg shadow p-3">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-semibold text-gray-600">Схема:</span>
                            <label className="p-1 bg-gray-50 rounded cursor-pointer hover:bg-gray-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none"
                                     viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                                          d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12V4m0 8l-4-4m4 4l4-4"/>
                                </svg>
                                <input
                                    type="file"
                                    accept=".json,.geojson,application/json,application/geo+json"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                            </label>
                        </div>
                        <select
                            value={selectedFile}
                            onChange={handleChange}
                            className="w-full bg-gray-50 font-semibold px-2 py-1.5 rounded focus:outline-none mb-2"
                        >
                            <option value="">--Выберите схему--</option>
                            {geoJsonFiles.map((g, i) => (
                                <option key={i} value={g.file}>{g.name}</option>
                            ))}
                        </select>
                        <button
                            onClick={() => {
                                if (selectedRoutes.length !== allRoutes.length) {
                                    setSelectedRoutes(allRoutes);
                                } else {
                                    setSelectedRoutes([]);
                                }
                            }}
                            className="text-blue-600 hover:text-blue-800 text-sm underline"
                        >
                            показать все
                        </button>
                    </div>

                    <div className="space-y-2">
                        {transportTypes.map(type => {
                            const routesInGroup = groupedRoutes[type] || [];
                            const selectedInGroup = routesInGroup.filter(r =>
                                selectedRoutes.some(sr => sr.name === r.name)
                            ).length;
                            const isExpanded = expandedGroups.has(type);
                            const isGroupVisible = visibleGroups.has(type);

                            return (
                                <div key={type} className="bg-white rounded-lg shadow overflow-hidden">
                                    {/* Group Header */}
                                    <div className="w-full px-2 py-1.5 flex items-center justify-between bg-gray-50 hover:bg-gray-100 transition text-sm">
                                        <div className="flex items-center flex-1 min-w-0">
                                            <button
                                                onClick={() => toggleGroup(type)}
                                                className="flex items-center mr-2 flex-shrink-0"
                                            >
                                                <span className="transform transition-transform mr-1 text-xs"
                                                      style={{transform: isExpanded ? 'rotate(90deg)' : 'rotate(0deg)'}}>
                                                    ▶
                                                </span>
                                            </button>
                                            <span className="font-semibold truncate mr-2">{transports[type] || type}</span>
                                            <input
                                                type="checkbox"
                                                checked={isGroupVisible}
                                                onChange={(e) => {
                                                    e.stopPropagation();
                                                    toggleGroupVisibility(type);
                                                }}
                                                className="form-checkbox h-4 w-4 flex-shrink-0"
                                            />
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
                                            <span className="text-gray-600">{selectedInGroup}/</span>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    selectAllInGroup(type);
                                                }}
                                                className="text-blue-600 hover:text-blue-800 underline"
                                            >
                                                {routesInGroup.length}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Group Content */}
                                    {isExpanded && (
                                        <div className="p-1 space-y-1">
                                            {routesInGroup.map(route => {
                                                const isChecked = selectedRoutes.some(r => r.name === route.name);
                                                return (
                                                    <label
                                                        key={route.transport_type + route.name}
                                                        className={`
                                                        flex items-center bg-gray-50 rounded px-2 py-1.5 cursor-pointer
                                                        hover:bg-gray-100 transition border-l-4
                                                        ${isChecked ? 'opacity-100' : 'opacity-50'}
                                                        `}
                                                        style={{borderLeftColor: route.color}}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => toggleRoute(route)}
                                                            className="form-checkbox h-4 w-4 mr-2 flex-shrink-0"
                                                        />
                                                        <span className="text-sm">
                                                            <span className="font-bold">{route.name}</span> ({calculateRouteLength(route, segmentLib).toFixed(2) || '-'} км, {route.interval || '-'} мин)
                                                        </span>
                                                    </label>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>


                    {isMenuOpen && (
                        <button
                            className="fixed bottom-4 left-1/4 ml-2 bg-white px-3 py-2 rounded shadow hover:bg-gray-50 z-1000"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            {"<"}
                        </button>
                    )}

                </div>
            )}

            <MapView center={ekb} routes={showRoutes} segmentLib={segmentLib}/>
        </div>
    );
};
