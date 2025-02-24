/* eslint-disable no-console */
/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-var-requires */
import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { execSync } from "child_process";
import fs from "fs";

// Load environment variables
dotenv.config();

// Check for API key
const apiKey = process.env.GEMINI_PRO_API_KEY;

if (!apiKey) {
  console.error("Error: GEMINI_PRO_API_KEY environment variable not set.");
  process.exit(1);
}

// Initialize generative AI model
const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash-thinking-exp-01-21",
});

// Prompt instructions
const PROMPT_INSTRUCTIONS = `As an expert code reviewer, first summarize the changes and then analyze the git diff.

Most importantly, understand that your role is to catch bugs, mistakes, and potential issues BEFORE the code is reviewed by the team. Your primary goal is to ensure that issues are caught early so that when a human reviewer looks at the code, they can focus on higher-level concerns and not waste time on trivial issues. If no action is needed, DO NOT PROVIDE THE FEEDBACK. I repeat, if no action is needed, DO NOT PROVIDE THE FEEDBACK.

Your review should cover the following aspects:

1. Change Summary & Commit Message:
   - Provide a concise overview of all changes made
   - Generate a commit message in the following format:

     type(scope): summary

     - Detailed bullet points of changes
     - Impact and reasoning for changes
     
     Breaking Changes (if any):
     - List any breaking changes


   Where type is one of: feat|fix|docs|style|refactor|perf|test|chore
   And scope is the affected area/module

2. Code Quality Assessment:
   - Identify potential bugs, logic errors, and edge cases
   - Flag any performance concerns or optimization opportunities
   - Check for proper error handling and validation
   - Evaluate variable/function naming for clarity and consistency
   - Verify type safety and proper type usage
   - Verify all numeric ranges have appropriate min/max constraints
   - Check consistency of constraints across related fields

3. Security Review:
   - Identify potential security vulnerabilities
   - Check for proper input validation and sanitization
   - Verify authentication/authorization handling if present
   - Flag any exposed sensitive information

4. Best Practices:
   - Assess adherence to coding standards and patterns
   - Check for code duplication or opportunities for DRY principles
   - Verify proper commenting and documentation
   - Evaluate test coverage implications
   - Verify consistency of constraints across similar fields
   - Flag any missing properties that exist in similar objects

5. Architecture & Design:
   - Analyze impact on existing architecture
   - Identify potential scalability issues
   - Check for proper separation of concerns
   - Evaluate API contract changes if present

6. Schema Validation:
   - Verify all numeric fields have appropriate min/max constraints
   - Check for consistency in constraints across related fields
   - Validate that time-related fields use appropriate ranges
   - Ensure all required constraints are present
   - Check for proper types and examples

7. Domain-Specific Validation:
   - Time fields: Verify hours are 0-23, minutes are 0-59
   - Date fields: Verify proper date format and ranges
   - Geographic fields: Verify proper country codes
   - Currency fields: Verify decimal precision

8. Documentation & Schema Consistency:
   - Check for typos and grammatical errors in descriptions and comments
   - Verify property descriptions match their names and types
   - Verify related properties are grouped together logically
   - Check that property descriptions are consistent in terminology and style
   - Flag properties where name and description have mismatched concepts
   - Verify that technical terms are used consistently across all documentation
   - Check that units mentioned in descriptions match the property usage
   - Flag descriptions that mix different concepts (e.g., hours vs minutes)
   - When reviewing property naming, verify that all property names match the domain and concept they represent. If you find any property whose name does not logically align with its domain (e.g., a property under "soundNightTime" that seems related to "electricityNightTime"), flag it as an inconsistency and propose a correction.
   - When reviewing api-v1.yaml, asyncapi.yaml, or other schema files, ensure that all properties are consistently named and described across similar objects. If you find any inconsistencies in their schema definitions (name, description, constraints), flag them as issues and propose corrections.

Please structure your response in this format:

## Commit Message
[Generated commit message following the format above]

## Critical Issues
[List any critical bugs, security issues, or major concerns that need immediate attention]

## Recommendations
[List all other findings with reasoning and suggested improvements, ensuring that for any issues identified, you provide the file path and recommended changes. INVEST A MAJORITY OF YOUR FOCUS HERE, BEING AS DETAILED AS POSSIBLE, THIS IS THE MOST IMPORTANT PART OF THE REVIEW. Additionally, for each recommendation, clearly separate it by providing a ### header followed by the recommendation]

## Best Practices & Improvements
[List optional improvements and best practice suggestions]

## Summary
[Provide a concise bullet-point summary of all findings, organized by file]

Format your response in markdown, with code examples where relevant using appropriate syntax highlighting.

Using the provided context below, evaluate the changes while considering the existing codebase architecture and patterns:`;

async function reviewDiff(commitOrBranch) {
  try {
    // Get the diff using git
    const diff = execSync(
      `git diff ${commitOrBranch} -- . ':(exclude)src/api-client'`,
      { maxBuffer: 10 * 1024 * 1024 },
    ).toString();

    // Check if the diff is empty
    if (!diff) {
      console.log(
        `No changes found between the current branch and ${commitOrBranch}`,
      );
      return;
    }

    // Read the AI-CONTEXT.md file
    const contextFilePath = "AI-CONTEXT.md";
    let context = "";

    if (fs.existsSync(contextFilePath)) {
      context = fs.readFileSync(contextFilePath, "utf-8");
    } else {
      console.warn(
        `Warning: ${contextFilePath} not found. Proceeding without additional context.`,
      );
    }

    // Read the diff_context.md file
    const diffContextFilePath = "local_utilities/diff_context.md";
    let diffContext = "";

    if (fs.existsSync(diffContextFilePath)) {
      diffContext = fs.readFileSync(diffContextFilePath, "utf-8");
    } else {
      console.warn(
        `Warning: ${diffContextFilePath} not found. Proceeding without additional diff context.`,
      );
    }

    // Construct the content for the API request
    const parts = [
      { text: PROMPT_INSTRUCTIONS },
      ...(diffContext
        ? [
            {
              text: `Here is some additional context for the diff: \n\n${diffContext}`,
            },
          ]
        : []),
      {
        text: `Here is some context for the codebase you're reviewing: \n\n${context}`,
      },
      {
        text:
          "# Codebase Changes from git diff (IMPORTANT: Know that lines that begin with the + character means I've ADDED that code, whereas lines with the - character means that I've removed that line) \n\n```diff\n" +
          diff +
          "\n```",
      },
    ];

    // Write the prompt to an input.md file
    const inputFilePath = "local_utilities/diff-prompt.md";
    const promptContent = parts.map((part) => part.text).join("\n\n");
    fs.writeFileSync(inputFilePath, promptContent);
    console.log(`Prompt written to ${inputFilePath}`);

    const content = {
      role: "user",
      parts: parts,
    };

    const request = {
      contents: [content],
    };

    // Calculate the total number of tokens
    const countTokens = (text) => {
      // Simple tokenization by splitting on whitespace and punctuation
      return text.split(/\s+|\b/).length;
    };

    const totalTokens = parts.reduce(
      (sum, part) => sum + countTokens(part.text),
      0,
    );
    console.log(`Total tokens for the API call: ${totalTokens}`);

    // Send the request to the Gemini API
    console.log("Sending request to the Gemini API...");
    const response = await model.generateContent(request);
    console.log("Received response from the Gemini API.");

    const generatedText = response.response.text();

    // Write the output to a file

    // Remove leading ```markdown or trailing ```
    const cleanedOutput = generatedText
      .replace(/^```markdown/, "")
      .replace(/```$/, "");

    // Write the cleaned output to a file
    const outputPath = "local_utilities/output/review_diff_output.md";
    console.log(`Output written to ${outputPath}`);
    fs.writeFileSync(outputPath, cleanedOutput);

    // Check if pandoc is available
    try {
      execSync("glow --version", { stdio: "ignore" });

      // Use Glow to display the output
      execSync(`glow ${outputPath}`, { stdio: "inherit" });
    } catch (pandocError) {
      console.warn(
        "Glo is not available. Logging the cleaned output to the console.",
      );
      // Log the cleaned output to the console
      console.log("Cleaned Gemini API Response:");
      console.log(cleanedOutput);
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

// Get commit ID or branch name from command-line arguments
const commitOrBranch = process.argv[2];
if (!commitOrBranch) {
  console.error("Usage: node review_diff.js <commit_id_or_branch_name>");
  process.exit(1);
}

// Create local_utilities directory if it doesn't exist
const dir = "local_utilities";
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir);
}

// Run the review
reviewDiff(commitOrBranch);
