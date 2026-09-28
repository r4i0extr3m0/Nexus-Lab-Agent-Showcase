from showcase.evaluate import evaluate_router, load_cases


def test_evaluation_cases_are_reproducible():
    cases = load_cases()
    report = evaluate_router(cases)

    assert report["cases"] == 10
    assert report["correct"] == 10
    assert report["accuracy"] == 1.0
