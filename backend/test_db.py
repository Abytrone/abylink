import os
from sqlalchemy import create_engine, Column, Integer, String
from sqlalchemy.orm import declarative_base, sessionmaker

# Database URL for SQLite
DATABASE_URL = "sqlite:///test.db"

# SQLAlchemy setup
Base = declarative_base()
engine = create_engine(DATABASE_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Simple test model
class TestModel(Base):
    __tablename__ = "test_table"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)

def test_sqlite_connection():
    print("Initializing test database...")
    # Create the tables
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()
    try:
        # Insert a test entry
        print("Inserting test record...")
        db_item = TestModel(name="Decentralized Stream App test")
        db.add(db_item)
        db.commit()
        db.refresh(db_item)
        
        # Verify it was written and read
        print(f"Verifying database entry. ID: {db_item.id}, Name: {db_item.name}")
        assert db_item.id is not None
        assert db_item.name == "Decentralized Stream App test"
        print("Database verification test passed successfully!")

    finally:
        db.close()
        
        # Clean up the test database file
        print("Cleaning up database files...")
        Base.metadata.drop_all(bind=engine)
        if os.path.exists("test.db"):
            os.remove("test.db")
        print("Cleaned up successfully.")

if __name__ == "__main__":
    test_sqlite_connection()
