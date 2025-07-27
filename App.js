import React, { useState, useEffect, useRef } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO, isValid, differenceInCalendarDays, startOfDay } from 'date-fns';

// List of Stoic quotes (now embedded for offline access)
const stoicQuotes = [
  "You have power over your mind - not outside events. Realize this, and you will find strength.",
  "Waste no more time arguing about what a good man should be. Be one.",
  "The happiness of your life depends upon the quality of your thoughts.",
  "If you are distressed by anything external, the pain is not due to the thing itself, but to your estimate of it; and this you have the power to revoke at any moment.",
  "It is not what happens to you, but how you react to it that matters.",
  "Man is not worried by real problems so much as by his imagined anxieties about real problems.",
  "First say to yourself what you would be; and then do what you have to do.",
  "We suffer more often in imagination than in reality.",
  "Difficulties strengthen the mind, as labor does the body.",
  "The greatest wealth is to live content with little.",
];

// Main App Component
const App = () => {
  // State for body weight data
  const [bodyWeight, setBodyWeight] = useState([]);
  // State for workout data
  const [workouts, setWorkouts] = useState([]);
  // State for saved workout routines
  const [workoutRoutines, setWorkoutRoutines] = useState([]);
  // Removed isDarkMode state

  // State for exercise database suggestions
  const [allExerciseNames, setAllExerciseNames] = useState([]);
  // State for filtered exercise suggestions based on user input
  const [filteredExerciseSuggestions, setFilteredExerciseSuggestions] = useState([]);

  // Streak tracking states
  const [streak, setStreak] = useState(0);
  const [lastUsedDate, setLastUsedDate] = useState(null); // Stores the date of the last app usage

  // Stoic quote state
  const [currentQuote, setCurrentQuote] = useState(''); // Now just stores the quote string

  // Input states for new weight entry
  const [newWeight, setNewWeight] = useState('');
  const [newWeightDate, setNewWeightDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Input states for new workout entry
  const [newWorkoutType, setNewWorkoutType] = useState('weight_training');
  const [newWorkoutDate, setNewWorkoutDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [newWorkoutExercises, setNewWorkoutExercises] = useState([{ name: '', sets: [{ reps: '', weight: '' }] }]);

  // Input states for new routine entry
  const [newRoutineName, setNewRoutineName] = useState('');
  const [newRoutineType, setNewRoutineType] = useState('weight_training');
  const [newRoutineExercises, setNewRoutineExercises] = useState([{ name: '', sets: [{ reps: '', weight: '' }] }]);

  // Refs for input fields to clear them after submission
  const weightInputRef = useRef(null);

  // Load data from localStorage on initial render
  useEffect(() => {
    try {
      const storedWeight = localStorage.getItem('bodyWeight');
      if (storedWeight) {
        setBodyWeight(JSON.parse(storedWeight));
      }
      const storedWorkouts = localStorage.getItem('workouts');
      if (storedWorkouts) {
        setWorkouts(JSON.parse(storedWorkouts));
      }
      const storedRoutines = localStorage.getItem('workoutRoutines');
      if (storedRoutines) {
        setWorkoutRoutines(JSON.parse(storedRoutines));
      }
      // Removed loading of isDarkMode
      
      // Load streak data
      const storedStreak = localStorage.getItem('streak');
      if (storedStreak) {
        setStreak(parseInt(storedStreak, 10));
      }
      const storedLastUsedDate = localStorage.getItem('lastUsedDate');
      if (storedLastUsedDate) {
        setLastUsedDate(parseISO(storedLastUsedDate));
      }
    } catch (error) {
      console.error("Failed to load data from localStorage:", error);
    }
  }, []);

  // Fetch exercise database on component mount
  useEffect(() => {
    const fetchExerciseDB = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const names = data.map(exercise => exercise.name);
        setAllExerciseNames(names);
      } catch (error) {
        console.error("Could not fetch exercise database:", error);
      }
    };
    fetchExerciseDB();
  }, []);

  // Streak calculation and saving logic
  useEffect(() => {
    const today = startOfDay(new Date());
    let currentStreak = streak;

    if (lastUsedDate) {
      const daysDifference = differenceInCalendarDays(today, startOfDay(lastUsedDate));

      if (daysDifference === 1) {
        currentStreak += 1;
      } else if (daysDifference > 1) {
        currentStreak = 1;
      }
    } else {
      currentStreak = 1;
    }

    setStreak(currentStreak);
    setLastUsedDate(today);

    // Save all data to localStorage whenever they change
    try {
      localStorage.setItem('bodyWeight', JSON.stringify(bodyWeight));
      localStorage.setItem('workouts', JSON.stringify(workouts));
      localStorage.setItem('workoutRoutines', JSON.stringify(workoutRoutines));
      localStorage.setItem('streak', currentStreak.toString());
      localStorage.setItem('lastUsedDate', format(today, 'yyyy-MM-dd'));
    } catch (error) {
      console.error("Failed to save data to localStorage:", error);
    }
  }, [bodyWeight, workouts, workoutRoutines]); // Removed isDarkMode from dependencies

  // Generate a random Stoic quote on component mount
  useEffect(() => {
    const randomIndex = Math.floor(Math.random() * stoicQuotes.length);
    setCurrentQuote(stoicQuotes[randomIndex]);
  }, []);

  // Function to add a new weight entry
  const addWeightEntry = (e) => {
    e.preventDefault();
    const weight = parseFloat(newWeight);
    if (!isNaN(weight) && newWeightDate) {
      setBodyWeight(prevWeight => {
        const existingIndex = prevWeight.findIndex(entry => entry.date === newWeightDate);
        if (existingIndex > -1) {
          const updatedWeight = [...prevWeight];
          updatedWeight[existingIndex] = { date: newWeightDate, weight };
          return updatedWeight;
        }
        return [...prevWeight, { date: newWeightDate, weight }].sort((a, b) => new Date(a.date) - new Date(b.date));
      });
      setNewWeight('');
      setNewWeightDate(format(new Date(), 'yyyy-MM-dd'));
      if (weightInputRef.current) {
        weightInputRef.current.focus();
      }
    }
  };

  // Function to add a new workout entry
  const addWorkoutEntry = (e) => {
    e.preventDefault();
    if (newWorkoutDate && newWorkoutExercises.every(ex => ex.name.trim() !== '')) {
      const newWorkout = {
        date: newWorkoutDate,
        type: newWorkoutType,
        exercises: newWorkoutExercises.map(ex => ({
          ...ex,
          sets: ex.sets.map(s => ({
            reps: parseInt(s.reps),
            weight: newWorkoutType === 'weight_training' ? parseFloat(s.weight) : undefined,
            duration: (newWorkoutType === 'bodyweight' || newWorkoutType === 'kettlebell') ? s.duration : undefined
          })).filter(s => s.reps || s.weight || s.duration)
        })).filter(ex => ex.name.trim() !== '' && ex.sets.length > 0)
      };

      if (newWorkout.exercises.length > 0) {
        setWorkouts(prevWorkouts =>
          [...prevWorkouts, newWorkout].sort((a, b) => new Date(a.date) - new Date(b.date))
        );
        setNewWorkoutType('weight_training');
        setNewWorkoutDate(format(new Date(), 'yyyy-MM-dd'));
        setNewWorkoutExercises([{ name: '', sets: [{ reps: '', weight: '' }] }]);
      }
    }
  };

  // Handlers for workout form (reused for routine form)
  const handleExerciseNameChange = (index, value, isRoutine = false) => {
    const updater = isRoutine ? setNewRoutineExercises : setNewWorkoutExercises;
    const currentExercises = isRoutine ? [...newRoutineExercises] : [...newWorkoutExercises];
    currentExercises[index].name = value;
    updater(currentExercises);

    if (value.length > 0) {
      const filtered = allExerciseNames.filter(name =>
        name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10);
      setFilteredExerciseSuggestions(filtered);
    } else {
      setFilteredExerciseSuggestions([]);
    }
  };

  const handleSetChange = (exerciseIndex, setIndex, field, value, isRoutine = false) => {
    const updater = isRoutine ? setNewRoutineExercises : setNewWorkoutExercises;
    const currentExercises = isRoutine ? [...newRoutineExercises] : [...newWorkoutExercises];
    currentExercises[exerciseIndex].sets[setIndex][field] = value;
    updater(currentExercises);
  };

  const addExercise = (isRoutine = false) => {
    const updater = isRoutine ? setNewRoutineExercises : setNewWorkoutExercises;
    const currentExercises = isRoutine ? [...newRoutineExercises] : [...newWorkoutExercises];
    updater([...currentExercises, { name: '', sets: [{ reps: '', weight: '', duration: '' }] }]);
  };

  const addSet = (exerciseIndex, isRoutine = false) => {
    const updater = isRoutine ? setNewRoutineExercises : setNewWorkoutExercises;
    const currentExercises = isRoutine ? [...currentExercises] : [...newWorkoutExercises];
    currentExercises[exerciseIndex].sets.push({ reps: '', weight: '', duration: '' });
    updater(currentExercises);
  };

  const removeExercise = (index, isRoutine = false) => {
    const updater = isRoutine ? setNewRoutineExercises : setNewWorkoutExercises;
    const currentExercises = isRoutine ? [...newRoutineExercises] : [...newWorkoutExercises];
    const updatedExercises = currentExercises.filter((_, i) => i !== index);
    updater(updatedExercises);
  };

  const removeSet = (exerciseIndex, setIndex, isRoutine = false) => {
    const updater = isRoutine ? setNewRoutineExercises : setNewWorkoutExercises;
    const currentExercises = isRoutine ? [...newRoutineExercises] : [...newWorkoutExercises];
    currentExercises[exerciseIndex].sets = currentExercises[exerciseIndex].sets.filter((_, i) => i !== setIndex);
    if (currentExercises[exerciseIndex].sets.length === 0) {
      currentExercises[exerciseIndex].sets.push({ reps: '', weight: '', duration: '' });
    }
    updater(currentExercises);
  };

  // Function to add a new workout routine
  const addWorkoutRoutine = (e) => {
    e.preventDefault();
    if (newRoutineName.trim() && newRoutineExercises.every(ex => ex.name.trim() !== '')) {
      const newRoutine = {
        id: Date.now(),
        name: newRoutineName.trim(),
        type: newRoutineType,
        exercises: newRoutineExercises.map(ex => ({
          ...ex,
          sets: ex.sets.map(s => ({
            reps: parseInt(s.reps),
            weight: newRoutineType === 'weight_training' ? parseFloat(s.weight) : undefined,
            duration: (newRoutineType === 'bodyweight' || newRoutineType === 'kettlebell') ? s.duration : undefined
          })).filter(s => s.reps || s.weight || s.duration)
        })).filter(ex => ex.name.trim() !== '' && ex.sets.length > 0)
      };

      if (newRoutine.exercises.length > 0) {
        setWorkoutRoutines(prevRoutines => [...prevRoutines, newRoutine]);
        setNewRoutineName('');
        setNewRoutineType('weight_training');
        setNewRoutineExercises([{ name: '', sets: [{ reps: '', weight: '' }] }]);
      }
    }
  };

  // Function to load a routine into the workout logger
  const loadRoutine = (routine) => {
    setNewWorkoutType(routine.type);
    setNewWorkoutExercises(JSON.parse(JSON.stringify(routine.exercises)));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Function to delete a routine
  const deleteRoutine = (routineId) => {
    setWorkoutRoutines(prevRoutines => prevRoutines.filter(r => r.id !== routineId));
  };

  // Prepare data for graphs
  const weightGraphData = bodyWeight.map(entry => ({
    date: format(parseISO(entry.date), 'MMM dd'),
    weight: entry.weight
  }));

  // Aggregate workout data for graphs
  const workoutProgressData = workouts.reduce((acc, workout) => {
    const date = format(parseISO(workout.date), 'MMM dd');
    let totalWeightLifted = 0;
    let totalReps = 0;

    workout.exercises.forEach(exercise => {
      exercise.sets.forEach(set => {
        if (set.weight) totalWeightLifted += (set.weight * set.reps);
        if (set.reps) totalReps += set.reps;
      });
    });

    const existingEntry = acc.find(entry => entry.date === date);
    if (existingEntry) {
      existingEntry.totalWeightLifted = (existingEntry.totalWeightLifted || 0) + totalWeightLifted;
      existingEntry.totalReps = (existingEntry.totalReps || 0) + totalReps;
      existingEntry.workoutCount = (existingEntry.workoutCount || 0) + 1;
    } else {
      acc.push({ date, totalWeightLifted, totalReps, workoutCount: 1 });
    }
    return acc;
  }, []).sort((a, b) => parseISO(a.date) - parseISO(b.date));

  // Prepare data for weight increase per workout (example for a specific exercise, e.g., Bench Press)
  const benchPressProgress = workouts
    .flatMap(workout =>
      workout.exercises
        .filter(ex => ex.name.toLowerCase() === 'bench press' && workout.type === 'weight_training')
        .flatMap(ex =>
          ex.sets.map(set => ({
            date: format(parseISO(workout.date), 'MMM dd'),
            weight: set.weight,
            reps: set.reps
          }))
        )
    )
    .filter(entry => entry.weight > 0)
    .sort((a, b) => parseISO(a.date) - parseISO(b.date));


  // Tailwind CSS classes for theme (simplified for light mode only)
  const containerClasses = `min-h-screen p-6 transition-colors duration-300 bg-gray-100 text-gray-900`;
  const cardClasses = `bg-white p-6 rounded-2xl shadow-xl mb-8`;
  const inputClasses = `w-full p-3 border-2 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-gray-50 text-gray-900`;
  const buttonClasses = `px-6 py-3 rounded-full transition-colors duration-200 font-medium text-lg`;
  const primaryButtonClasses = `${buttonClasses} bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg`;
  const secondaryButtonClasses = `${buttonClasses} bg-gray-200 text-gray-800 hover:bg-gray-300 shadow-md hover:shadow-lg`;
  const deleteButtonClasses = `${buttonClasses} bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg`;

  return (
    <div className={containerClasses}>
      <style>
        {`
          body { font-family: 'Inter', sans-serif; }
          /* Graph tooltip colors - adjusted for light mode only */
          .recharts-tooltip-label { color: #1f2937; }
          .recharts-tooltip-item-list { color: #1f2937; }
        `}
      </style>

      <div className="max-w-4xl mx-auto">
        <h1 className="text-5xl font-extrabold text-center mb-10 text-blue-600">Personal Health Tracker</h1>

        {/* Streak Display (Theme Toggle removed) */}
        <div className="flex justify-start items-center mb-8 p-4 bg-white rounded-2xl shadow-md">
          <div className={`text-xl font-bold flex items-center space-x-2 text-gray-900`}>
            <span role="img" aria-label="fire" className="text-orange-500 text-2xl">🔥</span>
            <span>Current Streak: <span className="text-blue-600 font-semibold">{streak} days</span></span>
          </div>
          {/* Theme Toggle button removed */}
        </div>

        {/* Body Weight Tracker Section */}
        <div className={cardClasses}>
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Body Weight Tracker (KG)</h2>
          <form onSubmit={addWeightEntry} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <input
              type="number"
              step="0.1"
              placeholder="Enter weight in KG"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              className={inputClasses}
              required
              ref={weightInputRef}
            />
            <input
              type="date"
              value={newWeightDate}
              onChange={(e) => setNewWeightDate(e.target.value)}
              className={inputClasses}
              required
            />
            <button type="submit" className={primaryButtonClasses}>
              Add Weight
            </button>
          </form>

          {/* Display recorded weights */}
          <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {bodyWeight.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No weight entries yet. Start tracking!</p>
            ) : (
              <ul className="space-y-3 text-gray-900">
                {bodyWeight.map((entry, index) => (
                  <li key={index} className="flex justify-between items-center p-3 rounded-lg bg-gray-50 shadow-sm">
                    <span className="text-lg font-medium">{format(parseISO(entry.date), 'MMM dd, yyyy')}: <span className="text-blue-600 font-semibold">{entry.weight} KG</span></span>
                    <button
                      onClick={() => setBodyWeight(bodyWeight.filter((_, i) => i !== index))}
                      className={`${deleteButtonClasses} px-4 py-2 text-sm`}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Stoic Quote Generator Section */}
        <div className={`${cardClasses} text-center`}>
          <h2 className="text-3xl font-bold mb-4 text-gray-800">Daily Wisdom</h2>
          {currentQuote ? (
            <div>
              <p className="text-xl italic mb-2 text-gray-700">"{currentQuote}"</p>
            </div>
          ) : (
            <p className="text-gray-500">Loading wisdom...</p>
          )}
        </div>

        {/* Workout Routines Section */}
        <div className={cardClasses}>
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Workout Routines</h2>
          <form onSubmit={addWorkoutRoutine} className="space-y-6 mb-8">
            <div>
              <label htmlFor="routineName" className="block text-lg font-medium mb-2">Routine Name</label>
              <input
                type="text"
                id="routineName"
                placeholder="e.g., Full Body A"
                value={newRoutineName}
                onChange={(e) => setNewRoutineName(e.target.value)}
                className={inputClasses}
                required
              />
            </div>
            <div>
              <label htmlFor="routineType" className="block text-lg font-medium mb-2">Routine Type</label>
              <select
                id="routineType"
                value={newRoutineType}
                onChange={(e) => {
                  setNewRoutineType(e.target.value);
                  setNewRoutineExercises([{ name: '', sets: [{ reps: '', weight: '', duration: '' }] }]);
                }}
                className={inputClasses}
              >
                <option value="weight_training">Weight Training</option>
                <option value="bodyweight">Bodyweight Workouts</option>
                <option value="kettlebell">Kettlebell Workout</option>
              </select>
            </div>

            {/* Exercise Inputs for Routine */}
            <div className="space-y-5">
              <h3 className="text-xl font-semibold">Exercises in Routine</h3>
              {newRoutineExercises.map((exercise, exerciseIndex) => (
                <div key={exerciseIndex} className="border border-gray-300 p-5 rounded-xl space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <input
                      type="text"
                      placeholder="Exercise Name"
                      value={exercise.name}
                      onChange={(e) => handleExerciseNameChange(exerciseIndex, e.target.value, true)}
                      className={inputClasses}
                      required
                      list="exercise-suggestions"
                    />
                    <button
                      type="button"
                      onClick={() => removeExercise(exerciseIndex, true)}
                      className={`${deleteButtonClasses} px-4 py-2 text-sm whitespace-nowrap`}
                      title="Remove Exercise"
                    >
                      Remove Exercise
                    </button>
                  </div>

                  {/* Sets Inputs for Routine */}
                  <div className="space-y-3 ml-4">
                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <input
                          type="number"
                          placeholder="Reps"
                          value={set.reps}
                          onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'reps', e.target.value, true)}
                          className={`${inputClasses} w-full sm:w-28`}
                        />
                        {newRoutineType === 'weight_training' && (
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Weight (KG)"
                            value={set.weight}
                            onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'weight', e.target.value, true)}
                            className={`${inputClasses} w-full sm:w-36`}
                          />
                        )}
                        {(newRoutineType === 'bodyweight' || newRoutineType === 'kettlebell') && (
                          <input
                            type="text"
                            placeholder="Duration (e.g., 60s)"
                            value={set.duration}
                            onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'duration', e.target.value, true)}
                            className={`${inputClasses} w-full sm:w-36`}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeSet(exerciseIndex, setIndex, true)}
                          className={`${deleteButtonClasses} px-4 py-2 text-sm whitespace-nowrap`}
                          title="Remove Set"
                        >
                          Remove Set
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addSet(exerciseIndex, true)}
                      className={`${secondaryButtonClasses} px-5 py-2 text-base`}
                    >
                      Add Set
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addExercise(true)}
                className={`${secondaryButtonClasses} px-6 py-3 text-base`}
              >
                Add Another Exercise
              </button>
            </div>
            <button type="submit" className={primaryButtonClasses}>
              Save Routine
            </button>
          </form>

          {/* Display Saved Routines */}
          <div className="mt-8 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {workoutRoutines.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No routines saved yet. Create one above!</p>
            ) : (
              <ul className="space-y-4 text-gray-900">
                {workoutRoutines.map((routine) => (
                  <li key={routine.id} className="p-4 rounded-xl bg-gray-50 shadow-md">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                      <span className="font-semibold text-xl text-gray-900 mb-2 sm:mb-0">{routine.name} <span className="text-base text-gray-600">({routine.type.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')})</span></span>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => loadRoutine(routine)}
                          className={`${primaryButtonClasses} px-4 py-2 text-sm`}
                        >
                          Load Routine
                        </button>
                        <button
                          onClick={() => deleteRoutine(routine.id)}
                          className={`${deleteButtonClasses} px-4 py-2 text-sm`}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {routine.exercises.map((exercise, exIndex) => (
                        <li key={exIndex}>
                          <span className="font-medium">{exercise.name}:</span>
                          <ul className="list-inside ml-4">
                            {exercise.sets.map((set, setIndex) => (
                              <li key={setIndex}>
                                {set.reps} reps
                                {set.weight && ` at ${set.weight} KG`}
                                {set.duration && ` for ${set.duration}`}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>


        {/* Gym Workouts Tracker Section */}
        <div className={cardClasses}>
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Gym Workouts Tracker</h2>
          <form onSubmit={addWorkoutEntry} className="space-y-6">
            <div>
              <label htmlFor="workoutDate" className="block text-lg font-medium mb-2">Date</label>
              <input
                type="date"
                id="workoutDate"
                value={newWorkoutDate}
                onChange={(e) => setNewWorkoutDate(e.target.value)}
                className={inputClasses}
                required
              />
            </div>
            <div>
              <label htmlFor="workoutType" className="block text-lg font-medium mb-2">Workout Type</label>
              <select
                id="workoutType"
                value={newWorkoutType}
                onChange={(e) => {
                  setNewWorkoutType(e.target.value);
                  setNewWorkoutExercises([{ name: '', sets: [{ reps: '', weight: '', duration: '' }] }]);
                }}
                className={inputClasses}
              >
                <option value="weight_training">Weight Training</option>
                <option value="bodyweight">Bodyweight Workouts</option>
                <option value="kettlebell">Kettlebell Workout</option>
              </select>
            </div>

            {/* Exercise Inputs */}
            <div className="space-y-5">
              <h3 className="text-xl font-semibold">Exercises</h3>
              {newWorkoutExercises.map((exercise, exerciseIndex) => (
                <div key={exerciseIndex} className="border border-gray-300 p-5 rounded-xl space-y-4 shadow-sm">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <input
                      type="text"
                      placeholder="Exercise Name"
                      value={exercise.name}
                      onChange={(e) => handleExerciseNameChange(exerciseIndex, e.target.value)}
                      className={inputClasses}
                      required
                      list="exercise-suggestions"
                    />
                    <button
                      type="button"
                      onClick={() => removeExercise(exerciseIndex)}
                      className={`${deleteButtonClasses} px-4 py-2 text-sm whitespace-nowrap`}
                      title="Remove Exercise"
                    >
                      Remove Exercise
                    </button>
                  </div>

                  {/* Sets Inputs */}
                  <div className="space-y-3 ml-4">
                    {exercise.sets.map((set, setIndex) => (
                      <div key={setIndex} className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                        <input
                          type="number"
                          placeholder="Reps"
                          value={set.reps}
                          onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'reps', e.target.value)}
                          className={`${inputClasses} w-full sm:w-28`}
                        />
                        {newWorkoutType === 'weight_training' && (
                          <input
                            type="number"
                            step="0.1"
                            placeholder="Weight (KG)"
                            value={set.weight}
                            onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'weight', e.target.value)}
                            className={`${inputClasses} w-full sm:w-36`}
                          />
                        )}
                        {(newWorkoutType === 'bodyweight' || newWorkoutType === 'kettlebell') && (
                          <input
                            type="text"
                            placeholder="Duration (e.g., 60s)"
                            value={set.duration}
                            onChange={(e) => handleSetChange(exerciseIndex, setIndex, 'duration', e.target.value)}
                            className={`${inputClasses} w-full sm:w-36`}
                          />
                        )}
                        <button
                          type="button"
                          onClick={() => removeSet(exerciseIndex, setIndex)}
                          className={`${deleteButtonClasses} px-4 py-2 text-sm whitespace-nowrap`}
                          title="Remove Set"
                        >
                          Remove Set
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => addSet(exerciseIndex)}
                      className={`${secondaryButtonClasses} px-5 py-2 text-base`}
                    >
                      Add Set
                    </button>
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={() => addExercise()}
                className={`${secondaryButtonClasses} px-6 py-3 text-base`}
              >
                Add Another Exercise
              </button>
            </div>
            <button type="submit" className={primaryButtonClasses}>
              Add Workout
            </button>
          </form>

          {/* Display recorded workouts */}
          <div className="mt-8 max-h-96 overflow-y-auto border border-gray-200 rounded-lg p-3">
            {workouts.length === 0 ? (
              <p className="text-center text-gray-500 py-4">No workout entries yet. Log your first workout!</p>
            ) : (
              <ul className="space-y-4 text-gray-900">
                {workouts.map((workout, index) => (
                  <li key={index} className="p-4 rounded-xl bg-gray-50 shadow-md">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3">
                      <span className="font-semibold text-xl text-gray-900 mb-2 sm:mb-0">{format(parseISO(workout.date), 'MMM dd, yyyy')} - <span className="text-base text-gray-600">({workout.type.replace('_', ' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')})</span></span>
                      <button
                        onClick={() => setWorkouts(workouts.filter((_, i) => i !== index))}
                        className={`${deleteButtonClasses} px-4 py-2 text-sm`}
                      >
                        Delete
                      </button>
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-gray-700">
                      {workout.exercises.map((exercise, exIndex) => (
                        <li key={exIndex}>
                          <span className="font-medium">{exercise.name}:</span>
                          <ul className="list-inside ml-4">
                            {exercise.sets.map((set, setIndex) => (
                              <li key={setIndex}>
                                {set.reps} reps
                                {set.weight && ` at ${set.weight} KG`}
                                {set.duration && ` for ${set.duration}`}
                              </li>
                            ))}
                          </ul>
                        </li>
                      ))}
                    </ul>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Progress Graphs Section */}
        <div className={cardClasses}>
          <h2 className="text-3xl font-bold mb-6 text-gray-800">Progress Graphs</h2>

          {/* Weight Progress Graph */}
          <h3 className="text-xl font-semibold mb-4 text-gray-800">Body Weight Progress</h3>
          {bodyWeight.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={weightGraphData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#1f2937" />
                <YAxis label={{ value: 'Weight (KG)', angle: -90, position: 'insideLeft', fill: '#1f2937' }} stroke="#1f2937" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: `1px solid #e2e8f0`, borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#1f2937' }}
                />
                <Legend />
                <Line type="monotone" dataKey="weight" stroke="#8884d8" activeDot={{ r: 8 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-4">Enter at least two weight entries to see the graph.</p>
          )}

          {/* Workout Progress Graph (Total Volume/Reps) */}
          <h3 className="text-xl font-semibold mt-8 mb-4 text-gray-800">Workout Volume Progress</h3>
          {workoutProgressData.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={workoutProgressData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#1f2937" />
                <YAxis yAxisId="left" label={{ value: 'Total Weight Lifted (KG)', angle: -90, position: 'insideLeft', fill: '#1f2937' }} stroke="#1f2937" />
                <YAxis yAxisId="right" orientation="right" label={{ value: 'Total Reps', angle: 90, position: 'insideRight', fill: '#1f2937' }} stroke="#1f2937" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: `1px solid #e2e8f0`, borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#1f2937' }}
                />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="totalWeightLifted" stroke="#82ca9d" name="Total Weight Lifted" />
                <Line yAxisId="right" type="monotone" dataKey="totalReps" stroke="#ffc658" name="Total Reps" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-4">Enter at least two workout entries to see the workout progress graph.</p>
          )}

          {/* Weight Increase Per Workout (Example: Bench Press) */}
          <h3 className="text-xl font-semibold mt-8 mb-4 text-gray-800">Bench Press Weight Progress (Example)</h3>
          {benchPressProgress.length > 1 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={benchPressProgress} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="date" stroke="#1f2937" />
                <YAxis label={{ value: 'Weight (KG)', angle: -90, position: 'insideLeft', fill: '#1f2937' }} stroke="#1f2937" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#fff', border: `1px solid #e2e8f0`, borderRadius: '0.5rem' }}
                  itemStyle={{ color: '#1f2937' }}
                  formatter={(value, name, props) => [`${value} KG`, `Reps: ${props.payload.reps}`]}
                />
                <Legend />
                <Line type="monotone" dataKey="weight" stroke="#ff7300" activeDot={{ r: 8 }} name="Weight Lifted" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-gray-500 py-4">Record at least two 'Bench Press' weight training entries to see this graph.</p>
          )}
        </div>

        {/* Datalist for exercise suggestions */}
        <datalist id="exercise-suggestions">
          {filteredExerciseSuggestions.map((name, index) => (
            <option key={index} value={name} />
          ))}
        </datalist>
      </div>
    </div>
  );
};

export default App;
