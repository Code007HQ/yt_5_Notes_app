import React, { useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import Container from "./components/Container";
import { Button } from "./components/ui/button";
import { cn, generateUniqueId } from "./lib/utils";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./components/ui/dialog";
import { Label } from "./components/ui/label";
import { Input } from "./components/ui/input";
import { Slider } from "./components/ui/slider";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { format } from "date-fns";
import { Switch } from "./components/ui/switch";
import api from "./lib/api-client";

type Note = {
  _id: string;
  title: string;
  description?: string;
  date: Date;
  priority: 1 | 2 | 3 | 4 | 5;
  isCompleted: boolean;
};

const App = () => {
  const [date, setDate] = React.useState<Date | undefined>(new Date());
  const [notes, setNotes] = React.useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = React.useState<Note[]>(notes);

  const [error, setError] = React.useState("");
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    const fetchNotes = async () => {
      setLoading(true);
      try {
        const response = await api.get("/notes");

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const formattedNotes = response.data.notes.map((note: any) => ({
          ...note,
          date: new Date(note.date),
        }));

        setNotes(formattedNotes);
      } catch (err) {
        setError("Failed to fetch notes");
        console.log("Error fetching notes:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotes();
  }, []);

  React.useEffect(() => {
    setFilteredNotes(
      notes.filter((note) => {
        return note.date.toDateString() === date?.toDateString();
      })
    );
  }, [notes, date]);

  const handleSort = (order: "asc" | "desc") => {
    setFilteredNotes((prev) =>
      [...prev].sort((a, b) =>
        order === "asc" ? a.priority - b.priority : b.priority - a.priority
      )
    );
  };

  const handleDelete = (note: Note) => {
    setNotes((prev) => prev.filter((item) => item._id !== note._id));
  };

  const handleCompleted = async (checked: boolean, note: Note) => {
    const updatedNote: Note = { ...note, isCompleted: checked };
    setNotes((prev) =>
      prev.map((item) => {
        if (item._id === updatedNote._id) {
          return updatedNote;
        } else {
          return item;
        }
      })
    );

    try {
      await api.put(`/notes/${note._id}`, { note: updatedNote });
    } catch (error) {
      console.log("Error updating note:", error);

      // Rollback changes on failure
      setNotes((prev) =>
        prev.map((item) =>
          item._id === note._id ? { ...note, isCompleted: !checked } : note
        )
      );
    }
  };

  if (error) return <p>{error}</p>;

  return (
    <Container>
      <div className="flex items-center justify-start gap-x-4 relative">
        <h1 className="text-5xl font-semibold absolute top-0 left-0">Notes</h1>

        <div className="w-[400px] h-[500px]">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(selectedDay) => {
              setDate(new Date(selectedDay!.getTime()));
            }}
            className="rounded-md border h-full w-full flex items-center justify-center"
          />
        </div>
        <div className="relative h-[630px] w-full flex items-center justify-center">
          <Toolbar date={date!} setNotes={setNotes} handleSort={handleSort} />
          <div className="flex items-center justify-start gap-4 flex-wrap">
            {filteredNotes.length > 0 ? (
              filteredNotes.map((note, i) => (
                <NoteCard
                  handleDelete={handleDelete}
                  key={i}
                  note={note}
                  handleCompleted={handleCompleted}
                />
              ))
            ) : loading ? (
              <div>Loading...</div>
            ) : (
              <div>Make new notes</div>
            )}
          </div>
        </div>
      </div>
    </Container>
  );
};

const NoteCard = ({
  note,
  handleDelete,
  handleCompleted,
}: {
  note: Note;
  handleDelete: (note: Note) => void;
  handleCompleted: (checked: boolean, note: Note) => void;
}) => {
  return (
    <Card
      className={cn("w-[250px] relative border-2", {
        "border-[#b10f2e] text-[#b10f2e]": note.priority === 5,
        "border-[#ec7505] text-[#ec7505]": note.priority === 4,
        "border-[#fcba04] text-[#fcba04]": note.priority === 3,
        "border-[#43aa8b] text-[#43aa8b]": note.priority === 2,
        "border-[#7ddf64] text-[#7ddf64]": note.priority === 1,
      })}
    >
      <CardHeader>
        <CardTitle>{note.title}</CardTitle>
        <CardDescription>{format(note.date, "do MMM, yyy")}</CardDescription>
      </CardHeader>
      <div
        onClick={() => handleDelete(note)}
        className="w-[20px] absolute top-4 right-4"
      >
        <img src="/x.svg" alt="delete" className="w-full object-contain" />
      </div>
      <CardContent>
        <p>{note.description}</p>
      </CardContent>
      <CardFooter className="flex flex-col items-start gap-y-2">
        <Label>Completed</Label>
        <Switch
          checked={note.isCompleted}
          onCheckedChange={(checked) => handleCompleted(checked, note)}
        />
      </CardFooter>
    </Card>
  );
};

const Toolbar = ({
  date,
  setNotes,
  handleSort,
}: {
  date: Date;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
  handleSort: (order: "asc" | "desc") => void;
}) => {
  const [sortOrder, setSortOrder] = React.useState<"asc" | "desc">("asc");

  return (
    <div className="w-full absolute inset-x-0 top-0 border-2 border-slate-200 rounded-lg flex items-center justify-between px-6 py-1">
      <CreateDialog date={date} setNotes={setNotes} />
      <Button
        variant={"outline"}
        onClick={() => {
          handleSort(sortOrder);
          setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
        }}
      >
        Sort
      </Button>
    </div>
  );
};

const CreateDialog = ({
  date,
  setNotes,
}: {
  date: Date;
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>;
}) => {
  const [note, setNote] = React.useState<Note>({
    date: date,
    priority: 1,
    title: "",
    isCompleted: false,
    _id: generateUniqueId(),
  });

  useEffect(() => {
    setNote((prev) => ({ ...prev, date }));
  }, [date]);

  const createNote = async () => {
    if (note.title === "") {
      return;
    }
    const tempId = note._id;
    setNotes((prev) => [...prev, note]);

    try {
      const response = await api.post("/notes", {
        title: note.title,
        description: note.description,
        date: note.date,
        priority: note.priority,
        isCompleted: note.isCompleted,
      });

      setNotes((prev) =>
        prev.map((n) =>
          n._id === tempId
            ? {
                ...response.data.note,
                _id: response.data.note._id,
                date: new Date(response.data.note.date),
              }
            : n
        )
      );
    } catch (error) {
      console.log("Error creating note:", error);
      setNotes((prev) => prev.filter((n) => n._id !== tempId)); // Rollback on failure
    }

    setNote({
      date: date,
      priority: 1,
      title: "",
      _id: generateUniqueId(),
      isCompleted: false,
    });
  };

  const setSliderValue = (v: number[]) => {
    setNote((prev) => ({
      ...prev,
      priority: v[0] === 0 ? 1 : (v[0] as 1 | 2 | 3 | 4 | 5),
    }));
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Create</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a new Note.</DialogTitle>
          <DialogDescription className="flex flex-col gap-y-2">
            <Label>Title</Label>
            <Input
              value={note.title}
              onChange={(e) =>
                setNote((prev) => ({ ...prev, title: e.target.value }))
              }
            />
            <Label>Description</Label>
            <Input
              value={note.description}
              onChange={(e) =>
                setNote((prev) => ({ ...prev, description: e.target.value }))
              }
            />
            <Label>Priority</Label>
            <Slider
              defaultValue={[1]}
              value={[note.priority]}
              onValueChange={setSliderValue}
              max={5}
              step={1}
            />
            <DialogClose asChild>
              <Button onClick={createNote}>Create</Button>
            </DialogClose>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};

export default App;
