import React, { useState } from 'react';
import {parseGeoJSONRoutes} from "@/entities/geo-data/convertor";

interface GeoJsonSelectorProps {
    setSelectedFile: (file: string) => void;
    setSelectedGeoJSON: (geo: any | null) => void;
}

interface GeoFile {
    name: string;
    file: string;
}

// Список доступных geojson-файлов
const geoJsonFiles: GeoFile[] = [
    { name: 'Scheme 1', file: '/routes_with_segment_refs.geo.json' },
    { name: 'Scheme 2 (without 68)', file: '/test_routes2_with_ids.geo.json' },
    { name: 'Все маршруты - текущая', file: '/all_routes_current_with_ids.geo.json' },
    { name: 'Трамваи - предлагаемая', file: '/tram_new_with_ids.geo.json' },
    { name: 'Трамваи - текущая', file: '/tram_current_with_ids.geo.json' },
    { name: 'Трамваи - инерционная', file: '/tram_inner_with_ids.geo.json' },
];

export default function VersionWidget({ setSelectedFile, setSelectedGeoJSON }: GeoJsonSelectorProps) {
    const [selected, setSelected] = useState<string>('');
    // const [selectedGeoJSON, setSelectedGeoJSON] = useState<any | null>(null);

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const fileName = e.target.value;
        setSelected(fileName);
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


    return (
        <div>
            <label htmlFor="geojмson-select">Выберите маршрут:</label>
            <select id="geojson-select" value={selected} onChange={handleChange}>

                <option value="">--Выберите маршрут--</option>
                {geoJsonFiles.map((geo, index) => (
                    <option key={index} value={geo.file}>
                        {geo.name}
                    </option>
                ))}
            </select>
            <input
                type="file"
                accept=".json,.geojson,application/json,application/geo+json"
                onChange={handleFileUpload}
            />
        </div>
    );
}
