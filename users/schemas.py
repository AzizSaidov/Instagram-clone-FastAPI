from datetime import datetime

from pydantic import BaseModel, ConfigDict, field_validator


class UserCreate(BaseModel):
    phone_number: str
    username: str
    password: str

    @field_validator("phone_number")
    @classmethod
    def validate_phone_number(cls, value: str):
        value = value.strip()

        if not value.startswith("+"):
            raise ValueError("Phone number must start with +")

        phone_digits = value[1:]

        if not phone_digits.isdigit() or len(phone_digits) < 9 or len(phone_digits) > 20:
            raise ValueError("Phone number must contain 9-20 digits after +")

        return value

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str):
        value = value.strip().lower()

        if len(value) < 3 or len(value) > 30:
            raise ValueError("Username must be 3-30 characters")

        if " " in value:
            raise ValueError("Username cannot contain spaces")

        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str):
        if len(value) < 8:
            raise ValueError("Password must be at least 8 characters")

        return value


class LoginSchema(BaseModel):
    login: str
    password: str

    @field_validator("login")
    @classmethod
    def validate_login(cls, value: str):
        value = value.strip().lower()

        if not value:
            raise ValueError("Phone number or username is required")

        return value

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str):
        if not value:
            raise ValueError("Password is required")

        return value


class ProfileInUser(BaseModel):
    id: int
    username: str
    full_name: str | None
    bio: str | None
    avatar_url: str | None
    is_private: bool

    model_config = ConfigDict(from_attributes=True)


class UserRead(BaseModel):
    id: int
    phone_number: str
    created_at: datetime
    profile: ProfileInUser

    model_config = ConfigDict(from_attributes=True)


class UserRegisterResponse(BaseModel):
    user: UserRead


class TokenSchema(BaseModel):
    access_token: str
    token_type: str


class UserMeResponse(BaseModel):
    user: UserRead
