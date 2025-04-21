import getRandomColor from "@/shared/helpers/getRandomColor";

interface IRouteSegmentRef {
	segment_id: number;
	is_reversed: boolean;
}

export function parseGeoJSONRoutes(geoJson: GeoJSON.FeatureCollection): IRoute[] {
	if (!geoJson?.features) return [];

	return geoJson.features
		.map(feature => {
			if (feature.geometry?.type !== 'LineString' || !feature.properties) {
				console.warn('Invalid route feature detected');
				return null;
			}

			const routeNumber = feature.properties.Number;
			const segmentRefs = feature.properties.segment_refs as IRouteSegmentRef[];

			console.log(geoJson)

			// Преобразуем сегменты в формат ключей библиотеки
			const segments = (segmentRefs || [])
				.map(({ segment_id }) => String(segment_id)) // Преобразуем ID в строку
				.filter(Boolean);

			return {
				name: routeNumber?.toString() || 'unnamed',
				segments: segments,
				color: getRandomColor(),
			};
		})
		.filter((route): route is IRoute => route !== null);
}