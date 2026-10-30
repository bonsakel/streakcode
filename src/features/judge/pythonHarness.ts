/**
 * Python half of the judge harness, evaluated once per Pyodide instance.
 *
 * It mirrors `harness.ts`: same output cap, same JSON normalization (non-finite floats tagged the
 * same way), same error shape. Comparison itself happens on the JS side so both languages share
 * one implementation; only an optional user `checker` runs in Python.
 *
 * Written with String.raw so Python escapes such as "\n" stay intact. Keep it free of backticks and
 * dollar-brace sequences.
 */
export const PYTHON_HARNESS = String.raw`
import io
import json
import math
import sys
import time

_MAX_STDOUT = 10 * 1024
_NON_FINITE = "__nonFinite"
_USER_FILE = "<user>"
_CHECKER_FILE = "<checker>"
_MAX_MESSAGE = 1000


class _Capture:
    def __init__(self, limit):
        self.parts = []
        self.size = 0
        self.limit = limit
        self.truncated = False

    def write(self, text):
        if not isinstance(text, str):
            text = str(text)
        remaining = self.limit - self.size
        if remaining <= 0:
            if text:
                self.truncated = True
        elif len(text) > remaining:
            self.parts.append(text[:remaining])
            self.size += remaining
            self.truncated = True
        else:
            self.parts.append(text)
            self.size += len(text)
        return len(text)

    def flush(self):
        pass

    def isatty(self):
        return False

    def getvalue(self):
        return "".join(self.parts)


class _Unserializable(Exception):
    pass


def _message(exc):
    try:
        return str(exc)[:_MAX_MESSAGE]
    except BaseException:
        return "Something unprintable was raised."


def _describe(exc, filename):
    line = None
    tb = exc.__traceback__
    while tb is not None:
        if tb.tb_frame.f_code.co_filename == filename:
            line = tb.tb_lineno
        tb = tb.tb_next
    err = {"name": type(exc).__name__, "message": _message(exc)}
    if line is not None:
        err["line"] = line
    return err


def _syntax_error(exc):
    err = {"name": type(exc).__name__, "message": getattr(exc, "msg", None) or _message(exc)}
    line = getattr(exc, "lineno", None)
    column = getattr(exc, "offset", None)
    if isinstance(line, int):
        err["line"] = line
    if isinstance(column, int):
        err["column"] = column
    return err


def _norm(value):
    if value is None or isinstance(value, (bool, str)):
        return value
    if isinstance(value, int):
        return value
    if isinstance(value, float):
        if math.isfinite(value):
            return value
        tag = "NaN" if math.isnan(value) else ("Infinity" if value > 0 else "-Infinity")
        return {_NON_FINITE: tag}
    if isinstance(value, (list, tuple)):
        return [_norm(item) for item in value]
    if isinstance(value, dict):
        out = {}
        for key, item in value.items():
            if key is not None and not isinstance(key, (str, int, float, bool)):
                raise _Unserializable("dict keys must be strings or numbers")
            out[key] = _norm(item)
        return out
    raise _Unserializable("a value of type " + type(value).__name__ + " has no JSON form")


def _load(source, filename, name):
    try:
        compiled = compile(source, filename, "exec")
    except (SyntaxError, ValueError) as exc:
        return None, {"kind": "compile_error", "error": _syntax_error(exc), "timeMs": None}
    namespace = {"__name__": "__main__"}
    try:
        exec(compiled, namespace)
    except BaseException as exc:
        return None, {"kind": "error", "error": _describe(exc, filename), "timeMs": None}
    fn = namespace.get(name)
    if not callable(fn):
        message = 'Function "' + name + '" is not defined. Did you rename or delete it?'
        return None, {"kind": "error", "error": {"name": "NameError", "message": message}, "timeMs": None}
    return fn, None


def _fail(error, time_ms):
    return {"kind": "error", "error": error, "timeMs": time_ms}


def _execute(code, fn_name, input_json, expected_json, checker_src):
    if not fn_name.isidentifier():
        return _fail({"name": "JudgeConfigError", "message": '"' + fn_name + '" is not a valid function name.'}, None)

    fn, failure = _load(code, _USER_FILE, fn_name)
    if failure is not None:
        return failure

    args = json.loads(input_json)
    checker_input = json.loads(input_json) if checker_src else None

    start = time.perf_counter()
    try:
        returned = fn(*args)
    except BaseException as exc:
        return _fail(_describe(exc, _USER_FILE), (time.perf_counter() - start) * 1000)
    time_ms = (time.perf_counter() - start) * 1000

    if hasattr(returned, "__await__"):
        if hasattr(returned, "close"):
            returned.close()
        message = "async functions are not supported in Python. Use a regular def."
        return _fail({"name": "TypeError", "message": message}, time_ms)

    try:
        value_json = json.dumps(_norm(returned), allow_nan=False, separators=(",", ":"))
    except (_Unserializable, TypeError, ValueError, RecursionError) as exc:
        message = "Return value is not JSON-serializable (" + _message(exc) + ")."
        return _fail({"name": "SerializationError", "message": message}, time_ms)

    checked = None
    if checker_src:
        check, failure = _load(checker_src, _CHECKER_FILE, "checker")
        if failure is not None:
            error = failure["error"]
            error["message"] = "Checker problem: " + error["message"]
            return _fail(error, time_ms)
        try:
            checked = bool(check(checker_input, json.loads(value_json), json.loads(expected_json)))
        except BaseException as exc:
            error = _describe(exc, _CHECKER_FILE)
            error["message"] = "Checker problem: " + error["message"]
            return _fail(error, time_ms)

    return {"kind": "returned", "value": value_json, "checked": checked, "timeMs": time_ms}


def __skill_run(code, fn_name, input_json, expected_json, checker_src):
    capture = _Capture(_MAX_STDOUT)
    saved = (sys.stdout, sys.stderr, sys.stdin)
    sys.stdout = capture
    sys.stderr = capture
    sys.stdin = io.StringIO("")
    try:
        result = _execute(code, fn_name, input_json, expected_json, checker_src)
    except BaseException as exc:
        result = _fail({"name": "InternalError", "message": _message(exc)}, None)
    finally:
        sys.stdout, sys.stderr, sys.stdin = saved
    result["stdout"] = capture.getvalue()
    result["stdoutTruncated"] = capture.truncated
    return json.dumps(result)
`;
