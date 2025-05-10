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
    const [showRoutes, setShowRoutes] = useState<IRoute[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const [selectedFile, setSelectedFile] = useState<string>("/routes_with_segment_refs.geo.json");
    const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
    const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);

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
            setShowRoutes(geo);
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
            setShowRoutes(geoJSON);
            //setConflicts(_conflicts);
        }
        f()
    }, [selectedFile]);

    useEffect(() => {
        window.setShowRoutes = setShowRoutes;
    }, [setShowRoutes]);

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
        setShowRoutes(prev =>
            prev.find(r => r.name === route.name)
                ? prev.filter(r => r.name !== route.name)
                : [...prev, route]
        );
    };

    const toggleType = (type: string) => {
        setSelectedTypes(prev =>
            prev.includes(type)
                ? prev.filter(t => t !== type)
                : [...prev, type]
        );
    };
    const transportTypes = Array.from(
        new Set(allRoutes.map(r => r.transport_type))
    );


    useEffect(() => {
        if (selectedTypes.length === 0) {
            // Если ни один тип не выбран — показываем все маршруты
            setShowRoutes(allRoutes);
        } else {
            // Иначе — фильтруем по выбранным типам
            setShowRoutes(
                allRoutes.filter(r => selectedTypes.includes(r.transport_type))
            );
        }
    }, [selectedTypes, allRoutes]);


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
                    {/* 1) Верхний блок селектора схем */}
                    <div className="flex items-center justify-between mb-4">
                        {/* Название текущей схемы */}
                        <span className="font-semibold">
                            {geoJsonFiles.find(f => f.file === selectedFile)?.name || 'Выберите схему'}
                        </span>
                        {/* Выпадающий список */}
                        <select
                            value={selectedFile}
                            onChange={handleChange}
                            className="ml-2 bg-white font-semibold px-2 py-1 rounded focus:outline-none"
                        >
                            <option value="">--Выберите--</option>
                            {geoJsonFiles.map((g, i) => (
                                <option key={i} value={g.file}>{g.name}</option>
                            ))}
                        </select>
                        {/* Кнопка загрузки */}
                        <label className="ml-2 p-1 bg-white rounded  cursor-pointer">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none"
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
                    <div className="mb-4">
                        <button onClick={() => setShowRoutes(showRoutes.length !== allRoutes.length ? allRoutes : [])}
                                className="w-full bg-blue-500 text-white py-2 rounded cursor-pointer hover:shadow-md transition">Все
                            маршруты
                        </button>
                    </div>

                    {/* Дропдаун-фильтр */}
                    <div className="relative w-full">
                        <button
                            onClick={() => setIsTypeMenuOpen(prev => !prev)}
                            className="w-full bg-white font-semibold px-2 py-2 mb-4 rounded focus:outline-none flex justify-between items-center"
                        >
                            {selectedTypes.length > 0
                                ? selectedTypes.map(t => transports[t] || t).join(', ')
                                : 'Фильтр по виду транспорта'}
                            <span className="ml-2 transform transition-transform"
                                  style={{transform: isTypeMenuOpen ? 'rotate(180deg)' : undefined}}>▼</span>
                        </button>

                        {isTypeMenuOpen && (
                            <div
                                className="absolute left-0 right-0 mt-1 bg-white border rounded shadow max-h-60 overflow-auto z-50">
                                {transportTypes.map(type => (
                                    <label
                                        key={type}
                                        className="flex items-center px-2 py-1 hover:bg-gray-100 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={selectedTypes.includes(type)}
                                            onChange={() => toggleType(type)}
                                            className="form-checkbox h-4 w-4"
                                        />
                                        <span className="ml-2">{transports[type] || type}</span>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-3">
                        {allRoutes.map(route => {
                            const isChecked = showRoutes.some(r => r.name === route.name);
                            return (
                                <label
                                    key={route.transport_type + route.name}
                                    className={`
                                    flex flex-col bg-white rounded-lg shadow p-4 cursor-pointer
                                    hover:shadow-md transition border-t-8
                                    ${isChecked ? 'opacity-100' : 'opacity-50'}
                                    `}
                                    style={{borderTopColor: route.color}}
                                >
                                    <div className="flex items-center mb-2">
                                        <input
                                            type="checkbox"
                                            checked={isChecked}
                                            onChange={() => toggleRoute(route)}
                                            className="form-checkbox h-5 w-5 mr-2"
                                        />
                                        <h4 className="font-semibold">{(transports[route.transport_type] || 'Маршрут') + ' ' + route.name}</h4>
                                    </div>

                                    <>
                                        <p className="text-sm">Интервал: {route.interval || '-'} мин</p>
                                        <p className="text-sm">Длина: {calculateRouteLength(route, segmentLib).toFixed(2) || '-'} км</p>
                                    </>
                                </label>
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
