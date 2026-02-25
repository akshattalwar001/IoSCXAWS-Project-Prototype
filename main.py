from fastapi import FastAPI, HTTPException, Query
from pydantic import BaseModel, Field
from typing import Optional, Literal
import json

with open("students_data.json", "r") as file:
    students_db: list[dict] = json.load(file)

app = FastAPI(
    title="Student Database API",
    description="A simple API to manage and analyze student records"
)


class Student(BaseModel):
    id: int
    name: str = Field(..., min_length=1)
    category: Literal["SC", "ST", "General"]
    residence: Literal["Hosteller", "Day Scholar"]
    gpa: float = Field(..., ge=0.0, le=10.0)
    semester: int = Field(..., ge=1, le=8)


class StudentUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[Literal["SC", "ST", "General"]] = None
    residence: Optional[Literal["Hosteller", "Day Scholar"]] = None
    gpa: Optional[float] = Field(None, ge=0.0, le=10.0)
    semester: Optional[int] = Field(None, ge=1, le=8)


def save_to_file():
    with open("students_data.json", "w") as file:
        json.dump(students_db, file, indent=2)


def find_student(student_id: int):
    for index, student in enumerate(students_db):
        if student["id"] == student_id:
            return index, student
    raise HTTPException(status_code=404, detail=f"Student with id {student_id} not found")


@app.get("/students", tags=["Students"])
def get_all_students(
    category: Optional[str] = Query(None, description="Filter by category: SC, ST, or General"),
    residence: Optional[str] = Query(None, description="Filter by: Hosteller or Day Scholar"),
    semester: Optional[int] = Query(None, description="Filter by semester number"),
    min_gpa: Optional[float] = Query(None, ge=0, le=10, description="Minimum GPA"),
    max_gpa: Optional[float] = Query(None, ge=0, le=10, description="Maximum GPA"),
):
    result = students_db

    if category:
        result = [s for s in result if s["category"].lower() == category.lower()]
    if residence:
        result = [s for s in result if s["residence"].lower() == residence.lower()]
    if semester:
        result = [s for s in result if s["semester"] == semester]
    if min_gpa is not None:
        result = [s for s in result if s["gpa"] >= min_gpa]
    if max_gpa is not None:
        result = [s for s in result if s["gpa"] <= max_gpa]

    return {"total": len(result), "students": result}


@app.get("/students/{student_id}", tags=["Students"])
def get_student(student_id: int):
    _, student = find_student(student_id)
    return student


@app.post("/students", status_code=201, tags=["Students"])
def add_student(student: Student):
    for s in students_db:
        if s["id"] == student.id:
            raise HTTPException(status_code=400, detail=f"Student with id {student.id} already exists")

    students_db.append(student.model_dump())
    save_to_file()
    return {"message": "Student added successfully", "student": student}


@app.put("/students/{student_id}", tags=["Students"])
def update_student(student_id: int, updates: StudentUpdate):
    index, student = find_student(student_id)
    update_data = updates.model_dump(exclude_none=True)
    student.update(update_data)
    students_db[index] = student
    save_to_file()
    return {"message": "Student updated successfully", "student": student}


@app.delete("/students/{student_id}", tags=["Students"])
def delete_student(student_id: int):
    index, student = find_student(student_id)
    students_db.pop(index)
    save_to_file()
    return {"message": f"Student '{student['name']}' deleted successfully"}


@app.get("/analytics/summary", tags=["Analytics"])
def performance_summary():
    if not students_db:
        return {"message": "No students in database"}

    total = len(students_db)
    all_gpas = [s["gpa"] for s in students_db]
    avg_gpa = round(sum(all_gpas) / total, 2)
    highest_gpa = max(all_gpas)
    lowest_gpa = min(all_gpas)

    levels = {"excellent (9+)": 0, "good (7-8.9)": 0, "average (5-6.9)": 0, "below_average (<5)": 0}
    for g in all_gpas:
        if g >= 9.0:
            levels["excellent (9+)"] += 1
        elif g >= 7.0:
            levels["good (7-8.9)"] += 1
        elif g >= 5.0:
            levels["average (5-6.9)"] += 1
        else:
            levels["below_average (<5)"] += 1

    return {
        "total_students": total,
        "average_gpa": avg_gpa,
        "highest_gpa": highest_gpa,
        "lowest_gpa": lowest_gpa,
        "performance_levels": levels,
    }


def group_stats(field):
    groups = {}
    for student in students_db:
        key = student[field]
        if key not in groups:
            groups[key] = []
        groups[key].append(student["gpa"])

    result = {}
    for key, gpas in groups.items():
        result[key] = {
            "total_students": len(gpas),
            "average_gpa": round(sum(gpas) / len(gpas), 2),
            "highest_gpa": max(gpas),
            "lowest_gpa": min(gpas),
        }
    return result


@app.get("/analytics/category", tags=["Analytics"])
def category_wise_analysis():
    return group_stats("category")


@app.get("/analytics/residence", tags=["Analytics"])
def residence_wise_analysis():
    return group_stats("residence")


@app.get("/analytics/toppers", tags=["Analytics"])
def get_toppers(
    count: int = Query(10, ge=1, le=100, description="How many top students to show"),
    category: Optional[str] = Query(None, description="Filter toppers by category"),
):
    pool = students_db

    if category:
        pool = [s for s in pool if s["category"].lower() == category.lower()]

    sorted_students = sorted(pool, key=lambda s: s["gpa"], reverse=True)
    toppers = sorted_students[:count]

    return {"total_shown": len(toppers), "toppers": toppers}


@app.get("/analytics/at-risk", tags=["Analytics"])
def at_risk_students(
    threshold: float = Query(5.5, ge=0, le=10, description="GPA below this = at risk"),
):
    at_risk = [s for s in students_db if s["gpa"] < threshold]
    at_risk.sort(key=lambda s: s["gpa"])

    return {"threshold": threshold, "total_at_risk": len(at_risk), "students": at_risk}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
