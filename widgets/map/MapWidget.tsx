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

interface MapWidgetProps {
    selectedFile: string;
    uploadedGeoJSON?: any | null;
}

const segmentLib = getSegmentLib();

export default function MapWidget(/*{selectedFile, uploadedGeoJSON}: MapWidgetProps*/) {
    const [allRoutes, setAllRoutes] = useState<IRoute[]>([]);
    const [showRoutes, setShowRoutes] = useState<IRoute[]>([]);
    const [isMenuOpen, setIsMenuOpen] = useState(true);
    const [selectedFile, setSelectedFile] = useState<string>("/routes_with_segment_refs.geo.json");
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

// Список доступных geojson-файлов
    const geoJsonFiles: GeoFile[] = [
        {name: 'Scheme 1', file: '/routes_with_segment_refs.geo.json'},
        {name: 'Scheme 2 (without 68)', file: '/test_routes2_with_ids.geo.json'},
        {name: 'Все маршруты - текущая', file: '/all_routes_current_with_ids.geo.json'},
        {name: 'Трамваи - предлагаемая', file: '/tram_new_with_ids.geo.json'},
        {name: 'Трамваи - текущая', file: '/tram_current_with_ids.geo.json'},
        {name: 'Трамваи - инерционная', file: '/tram_inner_with_ids.geo.json'},
    ];

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
                        <button onClick={() => setShowRoutes(allRoutes)}
                                className="w-full bg-blue-500 text-white py-2 rounded">Все маршруты
                        </button>
                    </div>
                    <div className="space-y-3">
                        {allRoutes.map((route, idx) => (<div
                                key={idx}
                                className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-md transition"
                                onClick={() => setShowRoutes([route])}
                            >
                                <h4 className="font-semibold mb-1">Маршрут {route.name}</h4>
                                <p className="text-sm">Интервал: - мин</p>
                                <p className="text-sm">Длина: - км</p>
                            </div>
                        ))}
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
            {/*<div className="absolute top-2.5 right-2.5 size bg-white p-1.5 border border-black z-[1000] overflow-scroll w-1/6 h-fit max-h-full">*/}
            {/*    <h3 className="text-lg font-semibold">Маршруты</h3>*/}
            {/*    <button*/}
            {/*        className="block my-1.25 w-full text-left"*/}
            {/*        onClick={() => setShowRoutes(allRoutes)}*/}
            {/*    >*/}
            {/*        Все маршруты*/}
            {/*    </button>*/}
            {/*    {allRoutes.map((route, index) => (*/}
            {/*        <button*/}
            {/*            key={index}*/}
            {/*            className="block my-1.25 w-full text-left"*/}
            {/*            onClick={() => setShowRoutes([route])}*/}
            {/*        >*/}
            {/*            Маршрут {route.name}*/}
            {/*        </button>*/}
            {/*    ))}*/}

            {/*</div>*/}
            <MapView center={ekb} routes={showRoutes} segmentLib={segmentLib}/>
        </div>
    );
};
