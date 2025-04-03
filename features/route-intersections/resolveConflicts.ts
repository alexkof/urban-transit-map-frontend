/**
 * Функция для разрешения конфликтов в маршрутах путем смещения конфликтных сегментов.
 * @param routes Исходные маршруты.
 * @param conflictSegments Список конфликтных сегментов, полученный от detector.
 * @param offset Величина отступа между сегментами (по умолчанию 10e-5).
 * @returns Скорректированные маршруты с разрешенными конфликтами.
 */
export default function resolveConflicts(
	routes: IRoute[],
	conflictSegments: { route: IRoute; point1: IPoint; point2: IPoint }[],
	offset: number = 10e-5
): IRoute[] {
	// Уникальные маршруты с конфликтами, отсортированные по имени
	const conflictingRoutes = Array.from(new Set(conflictSegments.map(cs => cs.route)))
		.sort((a, b) => a.name.localeCompare(b.name));

	// Создаем Map для хранения векторов смещения каждого маршрута
	const routeShiftVectors = new Map<IRoute, { dx: number; dy: number }>();

	conflictingRoutes.forEach((route, index) => {
		// Находим первый конфликтный сегмент маршрута
		const segment = conflictSegments.find(cs => cs.route === route);
		if (!segment) return;

		const { point1, point2 } = segment;
		const [x1, y1] = point1;
		const [x2, y2] = point2;

		// Вычисляем вектор направления сегмента
		const dxSegment = x2 - x1;
		const dySegment = y2 - y1;

		// Вычисляем перпендикулярный вектор (поворот на 90 градусов против часовой стрелки)
		const perpDx = -dySegment;
		const perpDy = dxSegment;

		// Нормализуем перпендикулярный вектор
		const length = Math.sqrt(perpDx ** 2 + perpDy ** 2);
		if (length === 0) return; // Игнорируем нулевой сегмент

		// Рассчитываем величину смещения
		const shiftMagnitude = offset * index;
		const dx = (perpDx / length) * shiftMagnitude;
		const dy = (perpDy / length) * shiftMagnitude;

		routeShiftVectors.set(route, { dx, dy });
	});

	// Создаем новые маршруты с применением смещения
	return routes.map(route => {
		const shift = routeShiftVectors.get(route);
		if (!shift) return { ...route };

		// Смещаем все точки маршрута
		const adjustedPoints = route.points.map(([x, y]) =>
			[x + shift.dx, y + shift.dy] as IPoint
		);

		return {
			...route,
			points: adjustedPoints
		};
	});
}