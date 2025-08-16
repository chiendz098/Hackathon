const express = require('express');
const router = express.Router();
const { TrialCourse, Quiz, User, Mentor } = require('../models');

// Get all trial courses with their quizzes
router.get('/', async (req, res) => {
  try {
    const trialCourses = await TrialCourse.findAll({
      include: [
        {
          model: Quiz,
          as: 'quizzes',
          order: [['order', 'ASC']],
        },
        {
          model: Mentor,
          as: 'mentor',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'avatar'],
            },
          ],
        },
      ],
      order: [['created_at', 'ASC']],
    });

    // Group by major for frontend compatibility
    const groupedByMajor = trialCourses.reduce((acc, course) => {
      if (!acc[course.major]) {
        acc[course.major] = {
          value: course.major,
          label: course.majorLabel,
          courses: [],
        };
      }
      acc[course.major].courses.push({
        id: course.id,
        title: course.title,
        description: course.description,
        quizzes: course.quizzes,
        mentor: course.mentor,
      });
      return acc;
    }, {});

    res.json(Object.values(groupedByMajor));
  } catch (error) {
    console.error('Error fetching trial courses:', error);
    res.status(500).json({ error: 'Failed to fetch trial courses' });
  }
});

// Get trial courses by major
router.get('/major/:major', async (req, res) => {
  try {
    const { major } = req.params;
    const trialCourses = await TrialCourse.findAll({
      where: { major },
      include: [
        {
          model: Quiz,
          as: 'quizzes',
          order: [['order', 'ASC']],
        },
        {
          model: Mentor,
          as: 'mentor',
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['name', 'avatar'],
            },
          ],
        },
      ],
      order: [['created_at', 'ASC']],
    });

    if (trialCourses.length === 0) {
      return res.status(404).json({ error: 'No trial courses found for this major' });
    }

    res.json({
      value: major,
      label: trialCourses[0].majorLabel,
      courses: trialCourses.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description,
        quizzes: course.quizzes,
        mentor: course.mentor,
      })),
    });
  } catch (error) {
    console.error('Error fetching trial courses by major:', error);
    res.status(500).json({ error: 'Failed to fetch trial courses' });
  }
});

// Get quizzes for a specific trial course
router.get('/:id/quizzes', async (req, res) => {
  try {
    const { id } = req.params;
    const quizzes = await Quiz.findAll({
      where: { trialCourseId: id },
      order: [['order', 'ASC']],
    });

    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Failed to fetch quizzes' });
  }
});

// Submit quiz answers and get results
router.post('/:id/submit', async (req, res) => {
  try {
    const { id } = req.params;
    const { answers } = req.body; // Array of answers

    const quizzes = await Quiz.findAll({
      where: { trialCourseId: id },
      order: [['order', 'ASC']],
    });

    if (quizzes.length === 0) {
      return res.status(404).json({ error: 'No quizzes found for this course' });
    }

    let correct = 0;
    const feedback = quizzes.map((quiz, index) => {
      const userAnswer = answers[index];
      const isCorrect = userAnswer === quiz.answer;
      if (isCorrect) correct++;

      return {
        question: quiz.question,
        your: userAnswer,
        correct: quiz.answer,
        explanation: quiz.explanation,
        isCorrect,
      };
    });

    const result = {
      correct,
      total: quizzes.length,
      percentage: Math.round((correct / quizzes.length) * 100),
      feedback,
    };

    res.json(result);
  } catch (error) {
    console.error('Error submitting quiz:', error);
    res.status(500).json({ error: 'Failed to submit quiz' });
  }
});

module.exports = router;
