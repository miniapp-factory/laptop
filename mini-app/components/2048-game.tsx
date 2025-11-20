"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Share } from "@/components/share";
import { url } from "@/lib/metadata";

const GRID_SIZE = 4;
const TILE_VALUES = [2, 4];
const TILE_PROBABILITIES = [0.9, 0.1];

function createEmptyGrid(): number[][] {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0));
}

function addRandomTile(grid: number[][]): number[][] {
  const emptyCells: [number, number][] = [];
  for (let r = 0; r < GRID_SIZE; r++) {
    for (let c = 0; c < GRID_SIZE; c++) {
      if (grid[r][c] === 0) emptyCells.push([r, c]);
    }
  }
  if (emptyCells.length === 0) return grid;
  const [r, c] = emptyCells[Math.floor(Math.random() * emptyCells.length)];
  const value = Math.random() < TILE_PROBABILITIES[0] ? TILE_VALUES[0] : TILE_VALUES[1];
  const newGrid = grid.map(row => [...row]);
  newGrid[r][c] = value;
  return newGrid;
}

function compress(row: number[]): number[] {
  const newRow = row.filter(v => v !== 0);
  while (newRow.length < GRID_SIZE) newRow.push(0);
  return newRow;
}

function merge(row: number[]): { mergedRow: number[]; scoreDelta: number } {
  const newRow = [...row];
  let scoreDelta = 0;
  for (let i = 0; i < GRID_SIZE - 1; i++) {
    if (newRow[i] !== 0 && newRow[i] === newRow[i + 1]) {
      newRow[i] *= 2;
      newRow[i + 1] = 0;
      scoreDelta += newRow[i];
    }
  }
  return { mergedRow: compress(newRow), scoreDelta };
}

function moveLeft(grid: number[][]): { newGrid: number[][]; scoreDelta: number } {
  let scoreDelta = 0;
  const newGrid = grid.map(row => {
    const compressed = compress(row);
    const { mergedRow, scoreDelta: delta } = merge(compressed);
    scoreDelta += delta;
    return mergedRow;
  });
  return { newGrid, scoreDelta };
}

function moveRight(grid: number[][]): { newGrid: number[][]; scoreDelta: number } {
  const reversed = grid.map(row => [...row].reverse());
  const { newGrid: moved, scoreDelta } = moveLeft(reversed);
  const restored = moved.map(row => [...row].reverse());
  return { newGrid: restored, scoreDelta };
}

function transpose(grid: number[][]): number[][] {
  return grid[0].map((_, i) => grid.map(row => row[i]));
}

function moveUp(grid: number[][]): { newGrid: number[][]; scoreDelta: number } {
  const transposed = transpose(grid);
  const { newGrid: moved, scoreDelta } = moveLeft(transposed);
  const restored = transpose(moved);
  return { newGrid: restored, scoreDelta };
}

function moveDown(grid: number[][]): { newGrid: number[][]; scoreDelta: number } {
  const transposed = transpose(grid);
  const { newGrid: moved, scoreDelta } = moveRight(transposed);
  const restored = transpose(moved);
  return { newGrid: restored, scoreDelta };
}

export default function Game2048() {
  const [grid, setGrid] = useState<number[][]>(createEmptyGrid());
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  useEffect(() => {
    let g = addRandomTile(addRandomTile(createEmptyGrid()));
    setGrid(g);
  }, []);

  const handleMove = (direction: "up" | "down" | "left" | "right") => {
    if (gameOver) return;
    let moveFn;
    switch (direction) {
      case "up":
        moveFn = moveUp;
        break;
      case "down":
        moveFn = moveDown;
        break;
      case "left":
        moveFn = moveLeft;
        break;
      case "right":
        moveFn = moveRight;
        break;
    }
    const { newGrid, scoreDelta } = moveFn(grid);
    if (JSON.stringify(newGrid) !== JSON.stringify(grid)) {
      const updated = addRandomTile(newGrid);
      setGrid(updated);
      setScore(prev => prev + scoreDelta);
      if (!hasMoves(updated)) setGameOver(true);
    }
  };

  const hasMoves = (g: number[][]): boolean => {
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (g[r][c] === 0) return true;
        if (c < GRID_SIZE - 1 && g[r][c] === g[r][c + 1]) return true;
        if (r < GRID_SIZE - 1 && g[r][c] === g[r + 1][c]) return true;
      }
    }
    return false;
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="grid grid-cols-4 gap-2">
        {grid.flat().map((value, idx) => (
          <div
            key={idx}
            className={`w-16 h-16 flex items-center justify-center rounded-md text-2xl font-bold ${
              value === 0
                ? "bg-gray-200 text-gray-500"
                : value <= 4
                ? "bg-yellow-200 text-yellow-800"
                : value <= 8
                ? "bg-yellow-300 text-yellow-800"
                : value <= 16
                ? "bg-yellow-400 text-yellow-800"
                : value <= 32
                ? "bg-yellow-500 text-yellow-800"
                : value <= 64
                ? "bg-yellow-600 text-yellow-800"
                : value <= 128
                ? "bg-yellow-700 text-yellow-800"
                : value <= 256
                ? "bg-yellow-800 text-yellow-800"
                : value <= 512
                ? "bg-yellow-900 text-yellow-800"
                : "bg-yellow-950 text-yellow-200"
            }`}
          >
            {value !== 0 ? value : null}
          </div>
        ))}
      </div>
      <div className="flex gap-2">
        <Button onClick={() => handleMove("up")}>↑</Button>
        <Button onClick={() => handleMove("left")}>←</Button>
        <Button onClick={() => handleMove("right")}>→</Button>
        <Button onClick={() => handleMove("down")}>↓</Button>
      </div>
      <div className="text-xl">Score: {score}</div>
      {gameOver && (
        <div className="flex flex-col items-center gap-2">
          <div className="text-2xl font-bold">Game Over!</div>
          <Share text={`I scored ${score} in 2048! ${url}`} />
        </div>
      )}
    </div>
  );
}
