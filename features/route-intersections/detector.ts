function getConflictPoints(routes: IRoute[]) {
	const pointToRoutes = new Map<string, IRoute[]>(); // Используем строку как ключ
	const JSONPointToIPoint = new Map<string, IPoint>();

	for (const route of routes) {
		for (const point of route.points) {
			// Преобразуем точку в строку для использования как ключ
			const pointKey = JSON.stringify(point);

			if (!pointToRoutes.has(pointKey)) {
				pointToRoutes.set(pointKey, []);
			}
			JSONPointToIPoint.set(pointKey, point);
			pointToRoutes.get(pointKey)!.push(route);
		}
	}

	const conflictPoints = [] as IPoint[];

	for (const [pointKey, routes] of pointToRoutes) {
		if (routes.length != 1) {
			const point = JSONPointToIPoint.get(pointKey);
			if (point) {
				conflictPoints.push(point);
			}
		}
	}

	return conflictPoints;
}

export type IConflicts = [IPoint[],  {route: IRoute, point1: IPoint, point2: IPoint}[]]

export default function detector(routes: IRoute[]) : IConflicts  {
	const conflictPoints = getConflictPoints(routes);
	const conflictSegments: {route: IRoute, point1: IPoint, point2: IPoint}[] = [];

	// Создаем Set для быстрой проверки, является ли точка конфликтной
	const conflictPointsSet = new Set<string>();
	for (const point of conflictPoints) {
		conflictPointsSet.add(JSON.stringify(point));
	}

	for (const route of routes) {
		// Проходим по всем точкам маршрута, кроме последней
		for (let i = 0; i < route.points.length - 1; i++) {
			const point1 = route.points[i];
			const point2 = route.points[i + 1];

			// Проверяем, являются ли обе точки конфликтными
			const isPoint1Conflict = conflictPointsSet.has(JSON.stringify(point1));
			const isPoint2Conflict = conflictPointsSet.has(JSON.stringify(point2));

			if (isPoint1Conflict && isPoint2Conflict) {
				conflictSegments.push({
					route: route,
					point1: point1,
					point2: point2
				});
			}
		}
	}

	return [conflictPoints, conflictSegments];
}