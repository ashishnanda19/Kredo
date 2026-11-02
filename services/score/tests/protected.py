# Protected and proxy attributes that must never be a scoring input (B1). College verification status is allowed;
# which college is not.
PROTECTED = {
    "gender", "sex", "religion", "caste", "community", "marital_status", "disability", "name", "first_name",
    "last_name", "full_name", "photo", "selfie", "college", "college_name", "college_ranking", "college_rank",
    "home_district", "district", "pin_code", "pincode", "postcode", "address", "date_of_birth", "dob", "location",
    "city", "state", "region", "language", "income",
}


# Verification *status* flags are allowed inputs even though they mention a protected word.
ALLOWED = {"college_id_verified", "college_email_verified", "f10_college_verified"}


def mentions_protected(name: str) -> set[str]:
    """Protected terms appearing as a whole word in a snake_case name (`f13_college_name` → {"college_name"})."""
    if name.lower() in ALLOWED:
        return set()
    lowered = f"_{name.lower()}_"
    return {p for p in PROTECTED if f"_{p}_" in lowered}
