from flask import request, jsonify
from functools import wraps
from typing import Callable, Dict, List, Any


class OptionalField:
    def __init__(self, field_type):
        self.field_type = field_type


def validate_json(required_fields: Dict[str, Any]):
    """
    Decorator to validate JSON request body against required fields and their types/schemas.
    Supports nested objects and arrays of structured objects.
    """
    def decorator(f: Callable):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not request.is_json:
                return jsonify({"error": "Request must be JSON"}), 400

            data = request.get_json()
            errors = _validate_schema(data, required_fields)

            if errors:
                return jsonify({"errors": errors}), 400

            return f(*args, **kwargs)
        return decorated_function
    return decorator


def _validate_schema(data: Any, schema: Any, path: str = "") -> List[str]:
    """
    Recursively validate data against a schema.
    Schema can be:
      - a type (e.g., str, int)
      - a tuple of types (e.g., (str, int))
      - a list with a single schema element (e.g., [dict])
      - a dict defining nested field requirements (e.g., {"name": str, "age": int})
    """
    errors = []

    if isinstance(schema, dict):
        if not isinstance(data, dict):
            errors.append(f"{path or 'root'} must be an object")
            return errors

        for field, field_type in schema.items():
            field_path = f"{path}.{field}" if path else field
            is_optional = isinstance(field_type, OptionalField)
            expected_type = field_type.field_type if is_optional else field_type

            if field not in data:
                if not is_optional:
                    errors.append(f"Missing required field: {field_path}")
                continue

            errors += _validate_schema(data[field], expected_type, field_path)

        for field in data:
            if field not in schema:
                field_path = f"{path}.{field}" if path else field
                errors.append(f"Invalid field: {field_path}")

    elif isinstance(schema, list):
        if not isinstance(data, list):
            errors.append(f"{path} must be a list")
            return errors

        if len(schema) != 1:
            errors.append(f"{path} schema must define a single list element type")
            return errors

        for idx, item in enumerate(data):
            item_path = f"{path}[{idx}]"
            errors += _validate_schema(item, schema[0], item_path)

    elif isinstance(schema, tuple):
        if not isinstance(data, schema):
            type_names = " or ".join([t.__name__ for t in schema])
            errors.append(f"{path} must be of type {type_names}. It is of type {type(data).__name__}.")

    elif isinstance(schema, type):
        if not isinstance(data, schema):
            errors.append(f"{path} must be of type {schema.__name__}. It is of type {type(data).__name__}.")

    else:
        errors.append(f"{path} has an unsupported schema definition")

    return errors
