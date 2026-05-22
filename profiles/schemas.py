from pydantic import BaseModel, ConfigDict, field_validator


class ProfileRead(BaseModel):
    id: int
    user_id: int
    username: str
    full_name: str | None
    bio: str | None
    avatar_url: str | None
    is_private: bool

    model_config = ConfigDict(from_attributes=True)


class ProfileUpdate(BaseModel):
    username: str | None = None
    full_name: str | None = None
    bio: str | None = None
    avatar_url: str | None = None
    is_private: bool | None = None

    @field_validator("username")
    @classmethod
    def validate_username(cls, value: str | None):
        if value is None:
            return value

        value = value.strip().lower()

        if len(value) < 3 or len(value) > 30:
            raise ValueError("Username must be 3-30 characters")

        if " " in value:
            raise ValueError("Username cannot contain spaces")

        return value

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, value: str | None):
        if value is None:
            return value

        value = value.strip()

        if len(value) > 100:
            raise ValueError("Full name must be less than 100 characters")

        return value

    @field_validator("bio")
    @classmethod
    def validate_bio(cls, value: str | None):
        if value is None:
            return value

        value = value.strip()

        if len(value) > 150:
            raise ValueError("Bio must be less than 150 characters")

        return value

    @field_validator("avatar_url")
    @classmethod
    def validate_avatar_url(cls, value: str | None):
        if value is None:
            return value

        value = value.strip()

        if len(value) > 255:
            raise ValueError("Avatar URL must be less than 255 characters")

        return value


class ProfileResponse(BaseModel):
    profile: ProfileRead
