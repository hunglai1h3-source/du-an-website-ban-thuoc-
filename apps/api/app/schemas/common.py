from pydantic import BaseModel, ConfigDict


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True, use_enum_values=True)


class Page(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
    pages: int


class Message(BaseModel):
    message: str

