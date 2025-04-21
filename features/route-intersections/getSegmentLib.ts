import geoJSONData from './all_lines_with_ids.geo.json';
// Функция преобразования GeoJSON в библиотеку сегментов
export const getSegmentLib = (): ISegmentLib => {
	const segmentLib = new Map<number, ISegment>();

	geoJSONData.features.forEach(feature => {
		// Проверяем наличие ID и правильный тип геометрии
		if (typeof feature.id !== 'number' || feature.geometry.type !== 'LineString') return;

		// Преобразуем координаты [lng, lat] → [lat, lng]
		const points: IPoint[] = feature.geometry.coordinates.map(
			([lng, lat]): IPoint => [lat, lng]
		);

		// Используем ID сегмента как ключ (преобразуем в строку)
		segmentLib.set(feature.id, points);
	});

	return segmentLib;
};

// Тип для GeoJSON структуры
type GeoJSONFeatureCollection = {
	type: "FeatureCollection";
	name: string;
	crs: {
		type: "name";
		properties: { name: string };
	};
	features: {
		type: "Feature";
		properties: Record<string, unknown>;
		geometry: {
			type: "LineString";
			coordinates: [number, number][];
		};
		id: number;
	}[];
};