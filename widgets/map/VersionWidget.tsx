import React, { useState } from 'react';

interface GeoJsonSelectorProps {
    setSelectedFile: (file: string) => void;
}

interface GeoFile {
    name: string;
    file: string;
}

// Список доступных geojson-файлов
const geoJsonFiles: GeoFile[] = [
    { name: 'Scheme 1', file: '/test_routes.geo.json' },
    { name: 'Scheme 2 (without 68)', file: '/test_routes2.geo.json' },
];

export default function VersionWidget({ setSelectedFile }: GeoJsonSelectorProps) {
    const [selected, setSelected] = useState<string>('');

    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const fileName = e.target.value;
        setSelected(fileName);
            // Передаём путь к файлу (с добавлением слеша для корректного запроса)
        setSelectedFile(fileName);
        console.log(fileName);
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
        </div>
    );
}
