"use client";

import type React from "react";

import { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface Egg {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  sliced: boolean;
  type: "normal" | "golden" | "bomb";
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
}

export default function EggSlicerGame() {
  const [eggs, setEggs] = useState<Egg[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [score, setScore] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [isSlicing, setIsSlicing] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [sliceTrail, setSliceTrail] = useState<{ x: number; y: number }[]>([]);

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>(0);
  const eggIdRef = useRef(0);
  const particleIdRef = useRef(0);

  const spawnEgg = useCallback(() => {
    if (!gameStarted || gameOver) return;

    const rand = Math.random();
    let eggType: "normal" | "golden" | "bomb";

    if (rand < 0.35) {
      eggType = "bomb"; // Tăng từ 15% lên 35% chance for bomb
    } else if (rand < 0.45) {
      eggType = "golden"; // 10% chance for golden
    } else {
      eggType = "normal"; // 55% chance for normal
    }

    const newEgg: Egg = {
      id: eggIdRef.current++,
      x: Math.random() * 300 + 50,
      y: -50,
      vx: (Math.random() - 0.5) * 2, // Giảm từ 3 xuống 2
      vy: 0.5 + Math.random() * 1, // Giảm xuống 0.5 + Math.random() * 1
      rotation: 0,
      rotationSpeed: (Math.random() - 0.5) * 6, // Giảm từ 8 xuống 6
      sliced: false,
      type: eggType,
    };

    setEggs((prev) => [...prev, newEgg]);
  }, [gameStarted, gameOver]);

  const createParticles = useCallback((x: number, y: number, color: string) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 8; i++) {
      newParticles.push({
        id: particleIdRef.current++,
        x,
        y,
        vx: (Math.random() - 0.5) * 10,
        vy: (Math.random() - 0.5) * 10,
        life: 30,
        maxLife: 30,
        color,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  const checkCollision = useCallback(
    (egg: Egg, mouseX: number, mouseY: number) => {
      const distance = Math.sqrt((egg.x - mouseX) ** 2 + (egg.y - mouseY) ** 2);
      return distance < 40;
    },
    []
  );

  const sliceEgg = useCallback(
    (eggId: number) => {
      setEggs((prev) =>
        prev.map((egg) => {
          if (egg.id === eggId && !egg.sliced) {
            if (egg.type === "bomb") {
              // Game over immediately when slicing bomb
              setGameOver(true);
              createParticles(egg.x, egg.y, "#ff0000");
            } else {
              createParticles(
                egg.x,
                egg.y,
                egg.type === "golden" ? "#ffd700" : "#fff8dc"
              );
              setScore(
                (prevScore) => prevScore + (egg.type === "golden" ? 10 : 1)
              );
            }
            return { ...egg, sliced: true };
          }
          return egg;
        })
      );
    },
    [createParticles]
  );

  const gameLoop = useCallback(() => {
    if (!gameStarted || gameOver) return;

    setEggs((prev) => {
      const updatedEggs = prev
        .map((egg) => ({
          ...egg,
          x: egg.x + egg.vx,
          y: egg.y + egg.vy,
          vy: egg.vy + 0.05, // Giảm xuống 0.05
          rotation: egg.rotation + egg.rotationSpeed,
        }))
        .filter((egg) => {
          if (egg.y > 450 && !egg.sliced && egg.type !== "bomb") {
            return false;
          }
          return egg.y < 500; // Remove eggs that fall off screen
        });

      return updatedEggs;
    });

    setParticles((prev) =>
      prev
        .map((particle) => ({
          ...particle,
          x: particle.x + particle.vx,
          y: particle.y + particle.vy,
          vy: particle.vy + 0.2,
          life: particle.life - 1,
        }))
        .filter((particle) => particle.life > 0)
    );

    setSliceTrail((prev) => prev.slice(-10));

    animationRef.current = requestAnimationFrame(gameLoop);
  }, [gameStarted, gameOver]);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!gameAreaRef.current) return;

      const rect = gameAreaRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      setMousePos({ x, y });

      if (isSlicing) {
        setSliceTrail((prev) => [...prev, { x, y }]);

        eggs.forEach((egg) => {
          if (!egg.sliced && checkCollision(egg, x, y)) {
            sliceEgg(egg.id);
          }
        });
      }
    },
    [isSlicing, eggs, checkCollision, sliceEgg]
  );

  const startGame = () => {
    setGameStarted(true);
    setGameOver(false);
    setScore(0);
    setEggs([]);
    setParticles([]);
  };

  const resetGame = () => {
    setGameStarted(false);
    setGameOver(false);
    setScore(0);
    setEggs([]);
    setParticles([]);
    setSliceTrail([]);
  };

  const shareToX = () => {
    const text = ` 
        Just sliced ${score} 🥚 in Egg Slicer Game!  

        Show off your skills and achievements too!  

        Bullish on @hyli_org and @SuccinctLabs

        Link to play: ${window.location.href}

        Follow @HunterGuy102 for more funny games 
`;

    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text
    )}`;

    window.open(twitterUrl, "_blank", "width=550,height=420");
  };

  useEffect(() => {
    if (gameStarted && !gameOver) {
      const spawnInterval = setInterval(spawnEgg, 500 + Math.random() * 500); // Giảm từ 1000 + Math.random() * 1000
      return () => clearInterval(spawnInterval);
    }
  }, [gameStarted, gameOver, spawnEgg]);

  useEffect(() => {
    if (gameStarted && !gameOver) {
      animationRef.current = requestAnimationFrame(gameLoop);
      return () => {
        if (animationRef.current) {
          cancelAnimationFrame(animationRef.current);
        }
      };
    }
  }, [gameStarted, gameOver, gameLoop]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-400 to-sky-600 flex items-center justify-center p-4">
      <Card className="w-full max-w-md mx-auto bg-pink-300/85 backdrop-blur-sm">
        <div className="p-6">
          <div className="text-center mb-4">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              🥚 Egg Slicer
            </h1>
            <div className="flex justify-between items-center">
              <div className="text-lg font-semibold">
                Score: <span className="text-blue-600">{score}</span>
              </div>
              {gameStarted && !gameOver && score > 0 && (
                <Button
                  onClick={shareToX}
                  size="sm"
                  variant="outline"
                  className="text-xs px-2 py-1 h-auto bg-transparent"
                >
                  Share
                </Button>
              )}
            </div>
          </div>

          <div
            ref={gameAreaRef}
            className="relative w-full h-96 bg-gradient-to-b from-blue-200 to-green-200 rounded-lg overflow-hidden cursor-crosshair border-2 border-gray-300"
            onMouseMove={handleMouseMove}
            onMouseDown={() => setIsSlicing(true)}
            onMouseUp={() => {
              setIsSlicing(false);
              setSliceTrail([]);
            }}
            onMouseLeave={() => {
              setIsSlicing(false);
              setSliceTrail([]);
            }}
          >
            {/* Slice trail */}
            {sliceTrail.length > 1 && (
              <svg className="absolute inset-0 pointer-events-none">
                <path
                  d={`M ${sliceTrail
                    .map((point) => `${point.x},${point.y}`)
                    .join(" L ")}`}
                  stroke="#ff6b6b"
                  strokeWidth="3"
                  fill="none"
                  opacity="0.7"
                />
              </svg>
            )}

            {/* Eggs */}
            {eggs.map((egg) => (
              <div
                key={egg.id}
                className={`absolute transition-opacity duration-300 ${
                  egg.sliced ? "opacity-0" : "opacity-100"
                }`}
                style={{
                  left: egg.x - 20,
                  top: egg.y - 20,
                  transform: `rotate(${egg.rotation}deg)`,
                }}
              >
                {egg.type === "bomb" ? (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-b from-gray-800 to-black border-2 border-red-500 shadow-lg relative">
                    <div className="absolute top-1 left-1/2 transform -translate-x-1/2 w-1 h-2 bg-orange-400 rounded-full"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-red-500 text-xs font-bold">
                      💣
                    </div>
                  </div>
                ) : (
                  <div
                    className={`w-10 h-12 rounded-full ${
                      egg.type === "golden"
                        ? "bg-gradient-to-b from-yellow-300 to-yellow-500 border-2 border-yellow-600"
                        : "bg-gradient-to-b from-white to-gray-100 border-2 border-gray-300"
                    } shadow-lg`}
                  />
                )}
              </div>
            ))}

            {/* Particles */}
            {particles.map((particle) => (
              <div
                key={particle.id}
                className="absolute w-1 h-1 rounded-full"
                style={{
                  left: particle.x,
                  top: particle.y,
                  backgroundColor: particle.color,
                  opacity: particle.life / particle.maxLife,
                }}
              />
            ))}

            {/* Game states */}
            {!gameStarted && !gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="text-center text-white">
                  <h2 className="text-2xl font-bold mb-4">Egg Slicer Game</h2>
                  <p className="mb-2">
                    Slice the falling eggs with your mouse!
                  </p>
                  <p className="mb-2 text-sm">🥚 Normal eggs = 1 point</p>
                  <p className="mb-2 text-sm">🥇 Golden eggs = 10 points</p>
                  <p className="mb-4 text-sm text-red-300">
                    💣 <strong>AVOID BOMBS!</strong> = Game Over
                  </p>
                  <Button
                    onClick={startGame}
                    className="bg-green-500 hover:bg-green-600"
                  >
                    Start Game
                  </Button>
                </div>
              </div>
            )}

            {gameOver && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-lg">
                <div className="text-center text-white">
                  <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
                  <p className="text-xl mb-4">Final Score: {score}</p>
                  <div className="space-y-3">
                    <div className="space-x-2">
                      <Button
                        onClick={startGame}
                        className="bg-green-500 hover:bg-green-600"
                      >
                        Play Again
                      </Button>
                      <Button
                        onClick={resetGame}
                        variant="outline"
                        className="bg-white text-black hover:bg-gray-100"
                      >
                        Menu
                      </Button>
                    </div>
                    <Button
                      onClick={shareToX}
                      className="w-full bg-blue-500 hover:bg-blue-600 text-white flex items-center justify-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      Share on X
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="mt-4 text-center text-sm text-gray-600">
            <p>🥚 Click and drag to slice eggs 🥚</p>
            <p>Inspired by @hyli_org and @SuccinctLabs</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
