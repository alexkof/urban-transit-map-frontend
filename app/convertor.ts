interface Route {
	name: string;
	points: Point[];
}

type Point = [number, number];

export function parseGeoJSONRoutes(geoJson: GeoJSON.FeatureCollection): Route[] {
	if (!geoJson || !geoJson.features) return [];
	return geoJson.features.map(feature => {
		// Проверяем тип геометрии и наличие свойств
		if (feature.geometry?.type !== 'LineString' || !feature.properties) {
			console.warn('Invalid route feature detected');
			return null;
		}

		// Извлекаем номер маршрута из свойств
		const routeNumber = feature.properties.Number;
		const coordinates = feature.geometry.coordinates;

		// Преобразуем координаты в точки с валидацией
		const points: Point[] = coordinates
			.map(coord => {
				if (coord.length >= 2 &&
					typeof coord[0] === 'number' &&
					typeof coord[1] === 'number') {
					return [coord[1], coord[0]] as Point;
				}
				console.warn('Invalid coordinate format', coord);
				return null;
			})
			.filter((point): point is Point => point !== null);

		return {
			name: routeNumber?.toString() || 'unnamed',
			points: points
		};
	}).filter((route): route is Route => route !== null);
}