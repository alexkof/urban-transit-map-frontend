import json


def round_coord(coord, decimal_places=12):
    return tuple(round(x, decimal_places) for x in coord)


def create_route_references(routes_file, segments_file, output_file):
    """
    Создает ссылки на полные сегменты (не разбивая на элементарные отрезки)
    """

    # Загрузка данных
    with open(routes_file, 'r', encoding='utf-8') as f:
        routes = json.load(f)

    with open(segments_file, 'r', encoding='utf-8') as f:
        segments = json.load(f)

    segment_dict = dict()

    for feature in segments['features']:
        coords = feature['geometry']['coordinates']
        segment_id = feature['id']

        # Прямое направление
        point1 = tuple(round_coord(coords[0]))
        point2 = tuple(round_coord(coords[1]))
        segment_dict[(point1, point2)] = (segment_id, False, len(coords))

        # Обратное направление
        point1 = tuple(round_coord(coords[-1]))
        point2 = tuple(round_coord(coords[-2]))
        segment_dict[(point1, point2)] = (segment_id, True, len(coords))

    # print(*segment_dict.items(), sep='\n')

    # Обрабатываем маршруты
    for route in routes['features']:
        route_coords = [tuple(p) for p in route['geometry']['coordinates']]
        route_segments = []
        i = 0
        n = len(route_coords)

        while i < n - 1:
            point1 = tuple(round_coord(route_coords[i]))
            point2 = tuple(round_coord(route_coords[i + 1]))
            matches = segment_dict.get((point1, point2), [])

            if matches:
                # print(matches)
                segment_id, is_reversed, length = matches
                route_segments.append({
                    'segment_id': segment_id,
                    'is_reversed': is_reversed,
                })
                i += length - 1
            else:
                print(f"Предупреждение: не найден сегмент для точки {i} в маршруте {route['properties'].get('Number')}")
                print(point1, point2)
                i += 1

        route['properties']['segment_refs'] = route_segments

    # Сохраняем результат
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(routes, f, ensure_ascii=False, indent=2)

    print(f"Обработано {len(routes['features'])} маршрутов. Результат в {output_file}")


if __name__ == "__main__":
    create_route_references(
        routes_file='public/all_routes_current.geo.json',
        segments_file='public/all_lines_with_ids.geo.json',
        output_file='public/routes_with_segment_refs.geo.json'
    )
