from flask import request, jsonify
from functools import wraps
from typing import Dict, Callable, Type, Union, Tuple


def validate_json(required_fields: Dict[str, Union[Type, Tuple[Type, ...]]]):
    """
    Decorator to validate JSON request body against required fields and their types
    
    Args:
        required_fields: Dictionary mapping field names to their expected types
    """
    def decorator(f: Callable):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Check if request contains JSON
            if not request.is_json:
                return jsonify({"error": "Request must be JSON"}), 400
            
            data = request.get_json()
            
            # Validate all fields exist and have correct types
            errors = []
            for field, expected_type in required_fields.items():
                if field not in data:
                    errors.append(f"Missing required field: {field}")
                elif not isinstance(data[field], expected_type):
                    # Get type name for error message
                    if isinstance(expected_type, tuple):
                        type_names = " or ".join([t.__name__ for t in expected_type])
                    else:
                        type_names = expected_type.__name__
                    
                    errors.append(f"Field {field} must be of type {type_names}")
            
            # Validate if data has any keys that are invalid
            for field in data.keys():
                if field not in required_fields:
                    errors.append(f"Invalid field: {field}")

            if errors:
                return jsonify({"errors": errors}), 400
                
            return f(*args, **kwargs)
        return decorated_function
    return decorator
